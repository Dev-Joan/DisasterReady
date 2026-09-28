const db = require('../db/connection');
const REFRESH_INTERVAL_MS = 30 * 60 * 1000;
const FETCH_TIMEOUT_MS = 6000;
const FORECAST_DAYS = 5;
const COUNTRY_COORDINATES = {
  'Lebanon': {
    latitude: 33.8938,
    longitude: 35.5018
  },
  'UAE': {
    latitude: 24.4539,
    longitude: 54.3773
  },
  'Saudi Arabia': {
    latitude: 24.7136,
    longitude: 46.6753
  },
  'Egypt': {
    latitude: 30.0444,
    longitude: 31.2357
  },
  'South Africa': {
    latitude: -25.7461,
    longitude: 28.1881
  },
  'UK': {
    latitude: 51.5074,
    longitude: -0.1278
  },
  'France': {
    latitude: 48.8566,
    longitude: 2.3522
  },
  'Germany': {
    latitude: 52.5200,
    longitude: 13.4050
  },
  'Italy': {
    latitude: 41.9028,
    longitude: 12.4964
  },
  'Greece': {
    latitude: 37.9838,
    longitude: 23.7275
  },
  'Japan': {
    latitude: 35.6762,
    longitude: 139.6503
  },
  'India': {
    latitude: 28.6139,
    longitude: 77.2090
  },
  'Philippines': {
    latitude: 14.5995,
    longitude: 120.9842
  },
  'Indonesia': {
    latitude: -6.2088,
    longitude: 106.8456
  },
  'China': {
    latitude: 39.9042,
    longitude: 116.4074
  },
  'US': {
    latitude: 38.9072,
    longitude: -77.0369
  },
  'Canada': {
    latitude: 45.4215,
    longitude: -75.6972
  },
  'Mexico': {
    latitude: 19.4326,
    longitude: -99.1332
  },
  'Brazil': {
    latitude: -15.7939,
    longitude: -47.8828
  },
  'Argentina': {
    latitude: -34.6037,
    longitude: -58.3816
  },
  'default': {
    latitude: 51.5074,
    longitude: -0.1278
  }
};
function getCoordinatesForCountry(country) {
  return COUNTRY_COORDINATES[country] || COUNTRY_COORDINATES['default'];
}
const WEATHER_CODES = {
  0: {
    description: 'Clear sky',
    icon: '☀️'
  },
  1: {
    description: 'Mainly clear',
    icon: '🌤️'
  },
  2: {
    description: 'Partly cloudy',
    icon: '⛅'
  },
  3: {
    description: 'Overcast',
    icon: '☁️'
  },
  45: {
    description: 'Fog',
    icon: '🌫️'
  },
  48: {
    description: 'Depositing rime fog',
    icon: '🌫️'
  },
  51: {
    description: 'Light drizzle',
    icon: '🌦️'
  },
  53: {
    description: 'Moderate drizzle',
    icon: '🌦️'
  },
  55: {
    description: 'Dense drizzle',
    icon: '🌦️'
  },
  56: {
    description: 'Light freezing drizzle',
    icon: '🌧️'
  },
  57: {
    description: 'Dense freezing drizzle',
    icon: '🌧️'
  },
  61: {
    description: 'Slight rain',
    icon: '🌧️'
  },
  63: {
    description: 'Moderate rain',
    icon: '🌧️'
  },
  65: {
    description: 'Heavy rain',
    icon: '🌧️'
  },
  66: {
    description: 'Light freezing rain',
    icon: '🌧️'
  },
  67: {
    description: 'Heavy freezing rain',
    icon: '🌧️'
  },
  71: {
    description: 'Slight snow fall',
    icon: '🌨️'
  },
  73: {
    description: 'Moderate snow fall',
    icon: '🌨️'
  },
  75: {
    description: 'Heavy snow fall',
    icon: '❄️'
  },
  77: {
    description: 'Snow grains',
    icon: '❄️'
  },
  80: {
    description: 'Slight rain showers',
    icon: '🌦️'
  },
  81: {
    description: 'Moderate rain showers',
    icon: '🌦️'
  },
  82: {
    description: 'Violent rain showers',
    icon: '⛈️'
  },
  85: {
    description: 'Slight snow showers',
    icon: '🌨️'
  },
  86: {
    description: 'Heavy snow showers',
    icon: '🌨️'
  },
  95: {
    description: 'Thunderstorm',
    icon: '⛈️'
  },
  96: {
    description: 'Thunderstorm with slight hail',
    icon: '⛈️'
  },
  99: {
    description: 'Thunderstorm with heavy hail',
    icon: '⛈️'
  }
};
function describeWeatherCode(code) {
  return WEATHER_CODES[code] || {
    description: 'Unknown',
    icon: '❔'
  };
}
const getCacheStmt = db.prepare('SELECT * FROM weather_cache WHERE country = ?');
const upsertCacheStmt = db.prepare(`
  INSERT INTO weather_cache (country, latitude, longitude, payload, fetched_at)
  VALUES (@country, @latitude, @longitude, @payload, @fetched_at)
  ON CONFLICT(country) DO UPDATE SET
    latitude = excluded.latitude, longitude = excluded.longitude,
    payload = excluded.payload, fetched_at = excluded.fetched_at
`);
function isFresh(fetchedAt) {
  return Date.now() - new Date(fetchedAt).getTime() < REFRESH_INTERVAL_MS;
}
function shapeResponse(raw) {
  const c = raw.current;
  const current = {
    temperature: c.temperature_2m,
    apparentTemperature: c.apparent_temperature,
    humidity: c.relative_humidity_2m,
    windSpeed: c.wind_speed_10m,
    weatherCode: c.weather_code,
    ...describeWeatherCode(c.weather_code),
    time: c.time
  };
  const d = raw.daily;
  const forecast = d.time.map((date, i) => ({
    date,
    weatherCode: d.weather_code[i],
    ...describeWeatherCode(d.weather_code[i]),
    tempMax: d.temperature_2m_max[i],
    tempMin: d.temperature_2m_min[i],
    precipitationSum: d.precipitation_sum[i],
    precipitationProbability: d.precipitation_probability_max[i],
    windSpeedMax: d.wind_speed_10m_max[i]
  }));
  return {
    current,
    forecast
  };
}
async function fetchFromOpenMeteo(latitude, longitude) {
  const url = new URL('https://api.open-meteo.com/v1/forecast');
  url.searchParams.set('latitude', latitude);
  url.searchParams.set('longitude', longitude);
  url.searchParams.set('current', 'temperature_2m,apparent_temperature,relative_humidity_2m,wind_speed_10m,weather_code');
  url.searchParams.set('daily', 'weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,precipitation_probability_max,wind_speed_10m_max');
  url.searchParams.set('timezone', 'auto');
  url.searchParams.set('forecast_days', String(FORECAST_DAYS));
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const response = await fetch(url, {
      signal: controller.signal
    });
    if (!response.ok) {
      throw new Error(`Open-Meteo responded with HTTP ${response.status}`);
    }
    const raw = await response.json();
    if (!raw.current || !raw.daily) {
      throw new Error('Open-Meteo response missing expected current/daily fields');
    }
    return shapeResponse(raw);
  } finally {
    clearTimeout(timeout);
  }
}
async function getWeatherForCountry(country) {
  const {
    latitude,
    longitude
  } = getCoordinatesForCountry(country);
  const cacheKey = COUNTRY_COORDINATES[country] ? country : 'default';
  const cached = getCacheStmt.get(cacheKey);
  if (cached && isFresh(cached.fetched_at)) {
    return {
      ...JSON.parse(cached.payload),
      source: 'cache-fresh',
      fetchedAt: cached.fetched_at
    };
  }
  try {
    const payload = await fetchFromOpenMeteo(latitude, longitude);
    const fetchedAt = new Date().toISOString();
    upsertCacheStmt.run({
      country: cacheKey,
      latitude,
      longitude,
      payload: JSON.stringify(payload),
      fetched_at: fetchedAt
    });
    return {
      ...payload,
      source: 'live',
      fetchedAt
    };
  } catch (err) {
    console.log('Weather fetch failed, falling back to cache if available:', err.message);
    if (cached) {
      return {
        ...JSON.parse(cached.payload),
        source: 'cache-stale',
        fetchedAt: cached.fetched_at
      };
    }
    throw new Error('Weather data unavailable and no cached value exists for this location');
  }
}
module.exports = {
  getWeatherForCountry,
  getCoordinatesForCountry,
  describeWeatherCode,
  REFRESH_INTERVAL_MS
};
