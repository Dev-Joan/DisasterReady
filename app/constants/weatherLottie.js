// Maps Open-Meteo's WMO weather codes (see server/services/weatherService.js
// WEATHER_CODES, which this mirrors) onto the 10 bundled weather Lottie
// icons in assets/lottie/weather/ (source: @meteocons/lottie, MIT — see
// assets/lottie/SOURCES.md).
const WEATHER_LOTTIE = {
  'clear-day': require('../assets/lottie/weather/clear-day.json'),
  'mostly-clear-day': require('../assets/lottie/weather/mostly-clear-day.json'),
  'partly-cloudy-day': require('../assets/lottie/weather/partly-cloudy-day.json'),
  overcast: require('../assets/lottie/weather/overcast.json'),
  fog: require('../assets/lottie/weather/fog.json'),
  drizzle: require('../assets/lottie/weather/drizzle.json'),
  rain: require('../assets/lottie/weather/rain.json'),
  snow: require('../assets/lottie/weather/snow.json'),
  thunderstorms: require('../assets/lottie/weather/thunderstorms.json'),
  'thunderstorms-hail': require('../assets/lottie/weather/thunderstorms-hail.json')
};

// A warm/cool accent per condition group, used to tint the current-
// conditions card so it visually reflects the actual weather rather than
// always looking the same neutral card colour.
const WEATHER_ACCENT = {
  'clear-day': '#F59E0B',
  'mostly-clear-day': '#F59E0B',
  'partly-cloudy-day': '#64748B',
  overcast: '#64748B',
  fog: '#94A3B8',
  drizzle: '#0EA5E9',
  rain: '#0EA5E9',
  snow: '#38BDF8',
  thunderstorms: '#7C3AED',
  'thunderstorms-hail': '#7C3AED'
};

function keyForWeatherCode(code) {
  if (code === 0) return 'clear-day';
  if (code === 1) return 'mostly-clear-day';
  if (code === 2) return 'partly-cloudy-day';
  if (code === 3) return 'overcast';
  if (code === 45 || code === 48) return 'fog';
  if ([51, 53, 55, 56, 57].includes(code)) return 'drizzle';
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return 'rain';
  if ([71, 73, 75, 77, 85, 86].includes(code)) return 'snow';
  if (code === 95) return 'thunderstorms';
  if (code === 96 || code === 99) return 'thunderstorms-hail';
  return 'partly-cloudy-day'; // sensible fallback for any unrecognised code
}

export function getWeatherLottieSource(weatherCode) {
  return WEATHER_LOTTIE[keyForWeatherCode(weatherCode)];
}

export function getWeatherAccentColor(weatherCode) {
  return WEATHER_ACCENT[keyForWeatherCode(weatherCode)];
}
