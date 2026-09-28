const db = require('../db/connection');
const weatherService = require('./weatherService');
const {
  mapCountryToHazards
} = require('./authService');
const {
  XMLParser
} = require('fast-xml-parser');
const ADVISORY_REFRESH_INTERVAL_MS = 20 * 60 * 1000;
const OFFICIAL_FETCH_TIMEOUT_MS = 6000;
async function fetchWithTimeout(url, options, timeoutMs) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, {
      ...options,
      signal: controller.signal
    });
  } finally {
    clearTimeout(timeout);
  }
}
const EARTH_RADIUS_KM = 6371;
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  const toRad = deg => deg * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * EARTH_RADIUS_KM * Math.asin(Math.sqrt(a));
}
function mapNwsSeverity(severity) {
  if (severity === 'Extreme' || severity === 'Severe') return 'critical';
  if (severity === 'Moderate') return 'warning';
  return 'advisory';
}
function classifyNwsHazard(eventName) {
  const e = (eventName || '').toLowerCase();
  if (e.includes('flood')) return 'flood';
  if (e.includes('fire') || e.includes('red flag')) return 'wildfire';
  if (e.includes('tsunami') || e.includes('earthquake')) return 'earthquake';
  if (e.includes('heat')) return 'heat';
  return 'severe_weather';
}
async function fetchNwsAdvisories(country, {
  latitude,
  longitude
}) {
  const response = await fetchWithTimeout(`https://api.weather.gov/alerts/active?point=${latitude},${longitude}`, {
    headers: {
      'User-Agent': 'DisasteReady (disaster-preparedness app)'
    }
  }, OFFICIAL_FETCH_TIMEOUT_MS);
  if (!response.ok) throw new Error(`NWS responded with HTTP ${response.status}`);
  const data = await response.json();
  return (data.features || []).map(f => {
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
const USGS_FEED_URL = 'https://earthquake.usgs.gov/earthquakes/feed/v1.0/summary/4.5_day.geojson';
const USGS_RADIUS_KM = 300;
function mapUsgsSeverity(magnitude) {
  if (magnitude >= 6.0) return 'critical';
  if (magnitude >= 5.0) return 'warning';
  return 'advisory';
}
async function fetchUsgsAdvisories(country, {
  latitude,
  longitude
}) {
  const response = await fetchWithTimeout(USGS_FEED_URL, {}, OFFICIAL_FETCH_TIMEOUT_MS);
  if (!response.ok) throw new Error(`USGS responded with HTTP ${response.status}`);
  const data = await response.json();
  const generatedAt = new Date().toISOString();
  return (data.features || []).filter(f => f.geometry && Array.isArray(f.geometry.coordinates)).map(f => {
    const [quakeLon, quakeLat] = f.geometry.coordinates;
    return {
      feature: f,
      distanceKm: haversineDistanceKm(latitude, longitude, quakeLat, quakeLon)
    };
  }).filter(({
    distanceKm
  }) => distanceKm <= USGS_RADIUS_KM).map(({
    feature,
    distanceKm
  }) => {
    const p = feature.properties;
    return {
      alertId: `official:${country}:usgs:${feature.id}`,
      country,
      hazard: 'earthquake',
      severity: mapUsgsSeverity(p.mag),
      source: 'official',
      message: `${p.title || `M${p.mag} earthquake`} - about ${Math.round(distanceKm)}km from your area.${p.tsunami ? ' A tsunami warning may be associated with this event.' : ''} Follow local authority guidance.`,
      generatedAt,
      expiresAt: new Date(p.time + 24 * 60 * 60 * 1000).toISOString()
    };
  });
}
const GDACS_FEED_URL = 'https://www.gdacs.org/gdacsapi/api/events/geteventlist/SEARCH';
const GDACS_RADIUS_KM = 500;
function mapGdacsSeverity(alertLevel) {
  if (alertLevel === 'Red') return 'critical';
  if (alertLevel === 'Orange') return 'warning';
  return 'advisory';
}
function classifyGdacsHazard(eventType) {
  if (eventType === 'FL') return 'flood';
  if (eventType === 'TC') return 'severe_weather';
  if (eventType === 'EQ') return 'earthquake';
  if (eventType === 'WF') return 'wildfire';
  return null;
}
async function fetchGdacsAdvisories(country, {
  latitude,
  longitude
}) {
  const response = await fetchWithTimeout(GDACS_FEED_URL, {}, OFFICIAL_FETCH_TIMEOUT_MS);
  if (!response.ok) throw new Error(`GDACS responded with HTTP ${response.status}`);
  const data = await response.json();
  const generatedAt = new Date().toISOString();
  return (data.features || []).filter(f => f.properties && f.properties.iscurrent === 'true').map(f => {
    const hazard = classifyGdacsHazard(f.properties.eventtype);
    if (!hazard || !f.geometry || !Array.isArray(f.geometry.coordinates)) return null;
    const [eventLon, eventLat] = f.geometry.coordinates;
    const distanceKm = haversineDistanceKm(latitude, longitude, eventLat, eventLon);
    if (distanceKm > GDACS_RADIUS_KM) return null;
    const p = f.properties;
    return {
      alertId: `official:${country}:gdacs:${p.eventid}`,
      country,
      hazard,
      severity: mapGdacsSeverity(p.alertlevel),
      source: 'official',
      message: `${p.name || p.description || 'GDACS disaster alert'} - about ${Math.round(distanceKm)}km from your area. Follow local authority guidance.`,
      generatedAt,
      expiresAt: p.todate ? new Date(p.todate.endsWith('Z') ? p.todate : `${p.todate}Z`).toISOString() : null
    };
  }).filter(Boolean);
}
const meteoalarmXmlParser = new XMLParser({
  ignoreAttributes: false,
  attributeNamePrefix: '@_'
});
const METEOALARM_COUNTRY_SLUGS = {
  UK: 'united-kingdom',
  France: 'france',
  Germany: 'germany',
  Italy: 'italy',
  Greece: 'greece'
};
function mapMeteoalarmSeverity(awarenessLevelValue) {
  const colour = (awarenessLevelValue || '').split(';')[1]?.trim().toLowerCase();
  if (colour === 'red') return 'critical';
  if (colour === 'orange') return 'warning';
  return 'advisory';
}
function classifyMeteoalarmHazard(awarenessTypeValue) {
  const name = (awarenessTypeValue || '').split(';')[1]?.trim().toLowerCase() || '';
  if (name.includes('rain') || name.includes('flood')) return 'flood';
  if (name.includes('wind') || name.includes('thunderstorm') || name.includes('coastal')) return 'severe_weather';
  if (name.includes('high temperature')) return 'heat';
  if (name.includes('forest fire')) return 'wildfire';
  return null;
}
function decodeDoubleEscapedEntities(text) {
  if (!text) return text;
  return text.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}
function toArray(value) {
  if (value == null) return [];
  return Array.isArray(value) ? value : [value];
}
async function fetchMeteoalarmAdvisories(country) {
  const slug = METEOALARM_COUNTRY_SLUGS[country];
  if (!slug) return [];
  const feedResponse = await fetchWithTimeout(`https://feeds.meteoalarm.org/feeds/meteoalarm-legacy-atom-${slug}`, {}, OFFICIAL_FETCH_TIMEOUT_MS);
  if (!feedResponse.ok) throw new Error(`MeteoAlarm feed responded with HTTP ${feedResponse.status}`);
  const feed = meteoalarmXmlParser.parse(await feedResponse.text());
  const entries = toArray(feed.feed && feed.feed.entry);
  const capLinks = new Set();
  for (const entry of entries) {
    const link = toArray(entry.link).find(l => l['@_type'] === 'application/cap+xml');
    if (link) capLinks.add(link['@_href']);
  }
  const generatedAt = new Date().toISOString();
  const rows = [];
  for (const link of capLinks) {
    try {
      const detailResponse = await fetchWithTimeout(link, {}, OFFICIAL_FETCH_TIMEOUT_MS);
      if (!detailResponse.ok) continue;
      const detail = meteoalarmXmlParser.parse(await detailResponse.text()).alert;
      const infos = toArray(detail.info);
      const info = infos.find(i => i.language === 'en-GB') || infos[0];
      if (!info) continue;
      const params = toArray(info.parameter);
      const levelParam = params.find(p => p.valueName === 'awareness_level');
      const typeParam = params.find(p => p.valueName === 'awareness_type');
      if (!levelParam || !typeParam) continue;
      const hazard = classifyMeteoalarmHazard(typeParam.value);
      if (!hazard) continue;
      rows.push({
        alertId: `official:${country}:meteoalarm:${detail.identifier}`,
        country,
        hazard,
        severity: mapMeteoalarmSeverity(levelParam.value),
        source: 'official',
        message: decodeDoubleEscapedEntities(info.headline || info.event) || 'MeteoAlarm weather warning in effect.',
        generatedAt,
        expiresAt: info.expires ? new Date(info.expires).toISOString() : null
      });
    } catch (err) {
      console.log(`MeteoAlarm detail fetch failed for ${link}, skipping this alert:`, err.message);
    }
  }
  return rows;
}
const OFFICIAL_SOURCES = {
  ALL: [fetchUsgsAdvisories, fetchGdacsAdvisories],
  US: [fetchNwsAdvisories],
  UK: [fetchMeteoalarmAdvisories],
  France: [fetchMeteoalarmAdvisories],
  Germany: [fetchMeteoalarmAdvisories],
  Italy: [fetchMeteoalarmAdvisories],
  Greece: [fetchMeteoalarmAdvisories]
};
function pickPeakDay(forecast, valueFn) {
  let best = null;
  for (const day of forecast) {
    const value = valueFn(day);
    if (value == null) continue;
    if (!best || value > best.value) best = {
      day,
      value
    };
  }
  return best;
}
function formatDay(dateStr, forecast) {
  return dateStr === forecast[0].date ? 'today' : new Date(`${dateStr}T00:00:00`).toLocaleDateString(undefined, {
    weekday: 'long'
  });
}
function floodRule(country, forecast, relevantHazards) {
  if (!relevantHazards.includes('flood')) return null;
  const peak = pickPeakDay(forecast, d => d.precipitationSum);
  if (!peak || peak.value < 20) return null;
  const severity = peak.value >= 50 ? 'critical' : 'warning';
  const when = formatDay(peak.day.date, forecast);
  const message = severity === 'critical' ? `Heavy rainfall of ${Math.round(peak.value)}mm expected ${when} - flash flood risk. Avoid low-lying roads and move to higher ground if needed.` : `Rainfall of ${Math.round(peak.value)}mm expected ${when} - flood risk in low-lying areas. Avoid unnecessary travel near rivers or flood-prone roads.`;
  return {
    alertId: `derived:${country}:flood`,
    country,
    hazard: 'flood',
    severity,
    source: 'derived',
    message
  };
}
function stormRule(country, forecast, relevantHazards) {
  if (!relevantHazards.includes('severe_weather')) return null;
  const peak = pickPeakDay(forecast, d => d.windSpeedMax);
  if (!peak || peak.value < 62) return null;
  const severity = peak.value >= 88 ? 'critical' : 'warning';
  const when = formatDay(peak.day.date, forecast);
  const message = severity === 'critical' ? `Sustained high winds up to ${Math.round(peak.value)}km/h expected ${when} - risk of structural damage and power outages. Secure loose outdoor objects and avoid travel if possible.` : `Strong winds up to ${Math.round(peak.value)}km/h expected ${when} - secure loose outdoor items and use caution when driving, especially in high-sided vehicles.`;
  return {
    alertId: `derived:${country}:severe_weather`,
    country,
    hazard: 'severe_weather',
    severity,
    source: 'derived',
    message
  };
}
function heatRule(country, forecast) {
  const peak = pickPeakDay(forecast, d => d.tempMax);
  if (!peak || peak.value < 35) return null;
  const severity = peak.value >= 40 ? 'critical' : 'warning';
  const when = formatDay(peak.day.date, forecast);
  const message = severity === 'critical' ? `Extreme heat of ${Math.round(peak.value)}°C expected ${when} - high risk of heat-related illness. Stay hydrated, avoid strenuous outdoor activity, and check on vulnerable family members and neighbours.` : `High temperatures up to ${Math.round(peak.value)}°C expected ${when} - stay hydrated and limit outdoor activity during peak afternoon heat.`;
  return {
    alertId: `derived:${country}:heat`,
    country,
    hazard: 'heat',
    severity,
    source: 'derived',
    message
  };
}
const DERIVED_RULES = [floodRule, stormRule, heatRule];
function deriveAdvisories(country, forecast) {
  const relevantHazards = mapCountryToHazards(country);
  const generatedAt = new Date().toISOString();
  const expiresAt = forecast.length ? `${forecast[forecast.length - 1].date}T23:59:59Z` : null;
  return DERIVED_RULES.map(rule => rule(country, forecast, relevantHazards)).filter(Boolean).map(advisory => ({
    ...advisory,
    generatedAt,
    expiresAt
  }));
}
const deleteBySourceStmt = db.prepare('DELETE FROM alerts WHERE country = ? AND source = ?');
const insertAlertStmt = db.prepare(`
  INSERT INTO alerts (alert_id, country, hazard, severity, source, message, generated_at, expires_at)
  VALUES (@alertId, @country, @hazard, @severity, @source, @message, @generatedAt, @expiresAt)
`);
const touchRefreshLogStmt = db.prepare(`
  INSERT INTO advisory_refresh_log (country, checked_at) VALUES (?, ?)
  ON CONFLICT(country) DO UPDATE SET checked_at = excluded.checked_at
`);
const writeAdvisoriesTx = db.transaction((country, officialRows, derivedRows, checkedAt) => {
  deleteBySourceStmt.run(country, 'official');
  for (const row of officialRows) insertAlertStmt.run(row);
  deleteBySourceStmt.run(country, 'derived');
  for (const row of derivedRows) insertAlertStmt.run(row);
  touchRefreshLogStmt.run(country, checkedAt);
});
async function refreshAdvisoriesForCountry(country) {
  const {
    latitude,
    longitude
  } = weatherService.getCoordinatesForCountry(country);
  const fetchers = [...(OFFICIAL_SOURCES.ALL || []), ...(OFFICIAL_SOURCES[country] || [])];
  const officialResults = await Promise.all(fetchers.map(fetcher => fetcher(country, {
    latitude,
    longitude
  }).catch(err => {
    console.log(`Official advisory fetch (${fetcher.name}) failed for ${country}, continuing without it:`, err.message);
    return [];
  })));
  const officialRows = officialResults.flat();
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
  return {
    country,
    alerts,
    lastCheckedAt: refreshedAt ? refreshedAt.checkedAt : null
  };
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
  fetchNwsAdvisories,
  fetchUsgsAdvisories,
  mapUsgsSeverity,
  fetchGdacsAdvisories,
  mapGdacsSeverity,
  classifyGdacsHazard,
  fetchMeteoalarmAdvisories,
  mapMeteoalarmSeverity,
  classifyMeteoalarmHazard,
  METEOALARM_COUNTRY_SLUGS,
  haversineDistanceKm,
  ADVISORY_REFRESH_INTERVAL_MS
};
