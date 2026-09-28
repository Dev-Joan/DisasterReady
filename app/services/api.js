import Constants from 'expo-constants';
function resolveApiHost() {
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];
  return DEV_FALLBACK_HOST;
}
const DEV_FALLBACK_HOST = '192.168.1.70';
const API_PORT = 3000;
const BASE_URL = `http://${resolveApiHost()}:${API_PORT}`;
async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: {
      'Content-Type': 'application/json'
    }
  };
  if (body) {
    options.body = JSON.stringify(body);
  }
  const response = await fetch(`${BASE_URL}${endpoint}`, options);
  const data = await response.json();
  if (!response.ok) {
    throw new Error(data.error || 'Request failed');
  }
  return data;
}
export default apiRequest;
