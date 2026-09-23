import Constants from 'expo-constants';

// The backend runs on the same machine as the Metro dev server, just on a
// different port. Instead of hardcoding that machine's LAN IP (which broke
// today — the network handed out a new IP and every request silently
// failed), this reads the IP Metro is ACTUALLY reachable on right now from
// Expo's own runtime config. `hostUri` looks like "192.168.1.70:8081" in
// dev (Expo Go / dev client); the port is swapped for the API server's.
function resolveApiHost() {
  // Confirmed against the installed expo-constants' own type definitions:
  // expoConfig.hostUri is populated "only present during development using
  // @expo/cli" — exactly this case.
  const hostUri = Constants.expoConfig?.hostUri;
  if (hostUri) return hostUri.split(':')[0];
  return DEV_FALLBACK_HOST; // last-known-good, only used if hostUri is ever unavailable
}

const DEV_FALLBACK_HOST = '192.168.1.70';
const API_PORT = 3000;
const BASE_URL = `http://${resolveApiHost()}:${API_PORT}`;

async function apiRequest(endpoint, method = 'GET', body = null) {
  const options = {
    method,
    headers: { 'Content-Type': 'application/json' }
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
