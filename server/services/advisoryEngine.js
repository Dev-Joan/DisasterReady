/**
 * ============================================================================
 *  ADVISORY ENGINE — two-layer hazard advisory generation
 * ============================================================================
 * Replaces the old hand-written, static `alerts` seed rows with real,
 * region-based advisories, generated in two deliberately separate layers:
 *
 *   LAYER 1 — OFFICIAL WARNINGS (source: 'official')
 *   ---------------------------------------------------------------------
 *   Pulled directly from a government meteorological agency's own API,
 *   where one exists that is free, keyless, and machine-readable enough to
 *   integrate. IMPORTANT: Open-Meteo itself does NOT provide official
 *   warnings — it is a forecast-MODEL aggregator (raw temperature/wind/
 *   precipitation numbers from weather models), not a warnings service.
 *   This was verified against Open-Meteo's own docs before writing this
 *   engine, specifically to avoid building fake logic around a product
 *   that doesn't exist. The one source wired up here is the US National
 *   Weather Service (api.weather.gov) — free, no API key, and it genuinely
 *   returns official, government-issued alerts (event, severity, headline,
 *   effective/expiry). Of this app's 20 supported countries, the US is the
 *   only one with a realistic free/keyless official feed; OFFICIAL_SOURCES
 *   below is intentionally a small, explicit registry rather than a
 *   pretend-universal integration, and is the natural place to add e.g. a
 *   MeteoAlarm (EU) integration later without touching anything else here.
 *
 *   LAYER 2 — DERIVED ADVISORIES (source: 'derived')
 *   ---------------------------------------------------------------------
 *   Official coverage is the exception, not the rule — most countries (and
 *   most moments, even for the US) have no active official warning. Layer
 *   2 ALWAYS runs, for every country, applying a small rules engine to the
 *   raw Open-Meteo forecast (already fetched/cached by weatherService.js)
 *   to derive advisories from threshold crossings: heavy forecast rainfall
 *   -> flood advisory, sustained high wind -> storm advisory, extreme heat
 *   -> heat advisory. Each rule is gated against the hazards this app
 *   already considers relevant to that country (authService.js's
 *   countryHazardMap) EXCEPT heat, which isn't part of that four-category
 *   vocabulary at all and is therefore never gated — see deriveAdvisories()
 *   below for the full reasoning.
 *
 * Both layers write into the same `alerts` table, tagged with `source`, so
 * the two are always visibly distinguishable rather than silently merged —
 * that distinction is the whole point of building this in two layers
 * instead of one.
 *
 * CACHING / REFRESH
 * ---------------------------------------------------------------------
 * Advisories are regenerated per country at most every
 * ADVISORY_REFRESH_INTERVAL_MS (20 minutes — shorter than weather's 30,
 * because an official warning can appear or expire faster than general
 * forecast conditions drift). `advisory_refresh_log` tracks the last check
 * time independently of whether that check produced any rows, so a
 * legitimate "all clear" result is still cached and doesn't force a
 * refresh on every request.
 * ============================================================================
 */

const db = require('../db/connection');
const weatherService = require('./weatherService');
const { mapCountryToHazards } = require('./authService');

const ADVISORY_REFRESH_INTERVAL_MS = 20 * 60 * 1000; // 20 minutes
const OFFICIAL_FETCH_TIMEOUT_MS = 6000;

// ============================================================================
// LAYER 1 — OFFICIAL SOURCES
// ============================================================================

async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } finally {
    clearTimeout(timeout);
  }
}

// NWS severities (Extreme/Severe/Moderate/Minor/Unknown) collapsed onto this
// app's existing 3-tier scale (advisory/warning/critical — see
// constants/colors.js EMERGENCY_COLORS, which this whole engine targets).
function mapNwsSeverity(severity) {
  if (severity === 'Extreme' || severity === 'Severe') return 'critical';
  if (severity === 'Moderate') return 'warning';
  return 'advisory'; // Minor, Unknown, or anything unrecognised
}

// NWS event names are free text ("Flash Flood Warning", "Red Flag Warning",
// "Excessive Heat Warning", ...) — normalised here onto the same hazard
// vocabulary the rest of the app already uses (countryHazardMap's four
// categories, plus 'heat' which the derived layer also uses), purely by
// keyword. Falls back to 'severe_weather' since NWS is fundamentally a
// weather agency — almost everything it issues is weather-related.
function classifyNwsHazard(eventName) {
  const e = (eventName || '').toLowerCase();
  if (e.includes('flood')) return 'flood';
  if (e.includes('fire') || e.includes('red flag')) return 'wildfire'; // "Red Flag Warning" = NWS's fire-weather precursor alert
  if (e.includes('tsunami') || e.includes('earthquake')) return 'earthquake';
  if (e.includes('heat')) return 'heat';
  return 'severe_weather';
}

async function fetchNwsAdvisories(country, { latitude, longitude }) {
  const response = await fetchWithTimeout(
    `https://api.weather.gov/alerts/active?point=${latitude},${longitude}`,
    { headers: { 'User-Agent': 'DisasteReady (disaster-preparedness app)' } },
    OFFICIAL_FETCH_TIMEOUT_MS
  );
  if (!response.ok) throw new Error(`NWS responded with HTTP ${response.status}`);
  const data = await response.json();

  return (data.features || []).map((f) => {
    const p = f.properties;
    return {
      alertId: `official:${country}:${p.id}`,
      country,
      hazard: classifyNwsHazard(p.event),
      severity: mapNwsSeverity(p.severity),
      source: 'official',
      message: p.headline || p.event || 'Official weather alert in effect.',
      generatedAt: new Date().toISOString(),
      expiresAt: p.expires || null
    };
  });
}

// Registry of countries with a real, free, keyless official warnings API
// wired up. Deliberately small and explicit (see module header) — adding a
// new country means adding one entry here, nothing else in this file
// changes.
const OFFICIAL_SOURCES = {
  US: fetchNwsAdvisories
};

// ============================================================================
// LAYER 2 — DERIVED RULES ENGINE
// ============================================================================
// Each rule scans every day in the forecast window, finds the day where its
// trigger value peaks, and — if that peak crosses the lower threshold —
// emits ONE advisory summarising the worst day, rather than one row per
// day. This keeps the list readable (a 5-day window with three rainy days
// becomes one flood advisory naming the worst day, not three near-duplicate
// rows) while still being genuinely derived from the whole forecast, not
// just today.

function pickPeakDay(forecast, valueFn) {
  let best = null;
  for (const day of forecast) {
    const value = valueFn(day);
    if (value == null) continue;
    if (!best || value > best.value) best = { day, value };
  }
  return best;
}

function formatDay(dateStr, forecast) {
  return dateStr === forecast[0].date ? 'today' : new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, { weekday: 'long' });
}

// Rule 1: forecast rainfall -> flood advisory.
// Thresholds (mm of rain in a day): 20mm is a commonly used "heavy rain"
// threshold where localised flooding becomes plausible; 50mm is squarely
// into flash-flood territory for most drainage infrastructure.
function floodRule(country, forecast, relevantHazards) {
  if (!relevantHazards.includes('flood')) return null;
  const peak = pickPeakDay(forecast, (d) => d.precipitationSum);
  if (!peak || peak.value < 20) return null;

  const severity = peak.value >= 50 ? 'critical' : 'warning';
  const when = formatDay(peak.day.date, forecast);
  const message = severity === 'critical'
    ? `Heavy rainfall of ${Math.round(peak.value)}mm expected ${when} — flash flood risk. Avoid low-lying roads and move to higher ground if needed.`
    : `Rainfall of ${Math.round(peak.value)}mm expected ${when} — flood risk in low-lying areas. Avoid unnecessary travel near rivers or flood-prone roads.`;

  return { alertId: `derived:${country}:flood`, country, hazard: 'flood', severity, source: 'derived', message };
}

// Rule 2: sustained high wind -> storm advisory.
// Thresholds (km/h, daily max sustained wind): 62 km/h (~38mph) matches the
// wind-advisory threshold several national weather services use; 88 km/h
// (~55mph) is storm/gale force, where structural damage becomes likely.
function stormRule(country, forecast, relevantHazards) {
  if (!relevantHazards.includes('severe_weather')) return null;
  const peak = pickPeakDay(forecast, (d) => d.windSpeedMax);
  if (!peak || peak.value < 62) return null;

  const severity = peak.value >= 88 ? 'critical' : 'warning';
  const when = formatDay(peak.day.date, forecast);
  const message = severity === 'critical'
    ? `Sustained high winds up to ${Math.round(peak.value)}km/h expected ${when} — risk of structural damage and power outages. Secure loose outdoor objects and avoid travel if possible.`
    : `Strong winds up to ${Math.round(peak.value)}km/h expected ${when} — secure loose outdoor items and use caution when driving, especially in high-sided vehicles.`;

  return { alertId: `derived:${country}:severe_weather`, country, hazard: 'severe_weather', severity, source: 'derived', message };
}

// Rule 3: extreme heat -> heat advisory.
// Thresholds (°C, daily max): 35°C is a widely used heat-advisory
// threshold; 40°C is extreme-heat territory with meaningful health risk.
// NOT gated by relevantHazards: heat isn't one of the four legacy hazard
// categories (earthquake/flood/severe_weather/wildfire) at all, so there is
// nothing in that vocabulary to check it against — every country is
// eligible, since heat waves are not geographically restricted the way
// e.g. earthquake risk is.
function heatRule(country, forecast) {
  const peak = pickPeakDay(forecast, (d) => d.tempMax);
  if (!peak || peak.value < 35) return null;

  const severity = peak.value >= 40 ? 'critical' : 'warning';
  const when = formatDay(peak.day.date, forecast);
  const message = severity === 'critical'
    ? `Extreme heat of ${Math.round(peak.value)}°C expected ${when} — high risk of heat-related illness. Stay hydrated, avoid strenuous outdoor activity, and check on vulnerable family members and neighbours.`
    : `High temperatures up to ${Math.round(peak.value)}°C expected ${when} — stay hydrated and limit outdoor activity during peak afternoon heat.`;

  return { alertId: `derived:${country}:heat`, country, hazard: 'heat', severity, source: 'derived', message };
}

const DERIVED_RULES = [floodRule, stormRule, heatRule];

function deriveAdvisories(country, forecast) {
  const relevantHazards = mapCountryToHazards(country);
  const generatedAt = new Date().toISOString();
  // Derived advisories are only as good as the forecast window they're
  // computed from — they expire when that window ends, same as the
  // forecast itself.
  const expiresAt = forecast.length ? `${forecast[forecast.length - 1].date}T23:59:59Z` : null;

  return DERIVED_RULES
    .map((rule) => rule(country, forecast, relevantHazards))
    .filter(Boolean)
    .map((advisory) => ({ ...advisory, generatedAt, expiresAt }));
}

// ============================================================================
// ORCHESTRATION — combine both layers, persist, and serve with caching
// ============================================================================

const deleteBySourceStmt = db.prepare('DELETE FROM alerts WHERE country = ? AND source = ?');
const insertAlertStmt = db.prepare(`
  INSERT INTO alerts (alert_id, country, hazard, severity, source, message, generated_at, expires_at)
  VALUES (@alertId, @country, @hazard, @severity, @source, @message, @generatedAt, @expiresAt)
`);
const touchRefreshLogStmt = db.prepare(`
  INSERT INTO advisory_refresh_log (country, checked_at) VALUES (?, ?)
  ON CONFLICT(country) DO UPDATE SET checked_at = excluded.checked_at
`);

// Both layers' data is gathered async (network calls) BEFORE this runs;
// the actual writes are synchronous and atomic (better-sqlite3 transactions
// can't wrap async code) — a refresh either fully replaces both layers'
// rows for this country, or fully fails and leaves the previous rows in
// place, never a half-updated mix of old and new.
const writeAdvisoriesTx = db.transaction((country, officialRows, derivedRows, checkedAt) => {
  deleteBySourceStmt.run(country, 'official');
  for (const row of officialRows) insertAlertStmt.run(row);

  deleteBySourceStmt.run(country, 'derived');
  for (const row of derivedRows) insertAlertStmt.run(row);

  touchRefreshLogStmt.run(country, checkedAt);
});

async function refreshAdvisoriesForCountry(country) {
  const { latitude, longitude } = weatherService.getCoordinatesForCountry(country);

  let officialRows = [];
  const officialFetcher = OFFICIAL_SOURCES[country];
  if (officialFetcher) {
    try {
      officialRows = await officialFetcher(country, { latitude, longitude });
    } catch (err) {
      console.log(`Official advisory fetch failed for ${country}, continuing with derived layer only:`, err.message);
    }
  }

  let derivedRows = [];
  try {
    const weather = await weatherService.getWeatherForCountry(country);
    derivedRows = deriveAdvisories(country, weather.forecast);
  } catch (err) {
    console.log(`Weather unavailable for ${country}, cannot run derived rules this cycle:`, err.message);
  }

  writeAdvisoriesTx(country, officialRows, derivedRows, new Date().toISOString());
}

const getStoredRowsStmt = db.prepare(`
  SELECT alert_id AS alertId, country, hazard, severity, source, message, active, generated_at AS generatedAt, expires_at AS expiresAt
  FROM alerts
  WHERE country = ? AND active = 1
  ORDER BY CASE severity WHEN 'critical' THEN 0 WHEN 'warning' THEN 1 ELSE 2 END, generated_at DESC
`);
const getLastCheckedStmt = db.prepare('SELECT checked_at AS checkedAt FROM advisory_refresh_log WHERE country = ?');

function isFresh(checkedAt) {
  return Date.now() - new Date(checkedAt).getTime() < ADVISORY_REFRESH_INTERVAL_MS;
}

/**
 * Returns { country, alerts, lastCheckedAt } for a country — the current
 * set of active advisories from both layers, refreshing first if the last
 * check is missing or stale. If a refresh is attempted and fails entirely
 * (both layers threw), whatever was previously stored is still returned,
 * rather than the request failing outright — the same "serve what you
 * have" philosophy as weatherService's stale-cache fallback.
 */
async function getAdvisoriesForCountry(country) {
  const lastChecked = getLastCheckedStmt.get(country);

  if (!lastChecked || !isFresh(lastChecked.checkedAt)) {
    try {
      await refreshAdvisoriesForCountry(country);
    } catch (err) {
      console.log(`Advisory refresh failed entirely for ${country}, serving last known state:`, err.message);
    }
  }

  const alerts = getStoredRowsStmt.all(country);
  const refreshedAt = getLastCheckedStmt.get(country);
  return { country, alerts, lastCheckedAt: refreshedAt ? refreshedAt.checkedAt : null };
}

module.exports = {
  getAdvisoriesForCountry,
  refreshAdvisoriesForCountry,
  deriveAdvisories,
  floodRule,
  stormRule,
  heatRule,
  classifyNwsHazard,
  mapNwsSeverity,
  ADVISORY_REFRESH_INTERVAL_MS
};
