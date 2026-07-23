// Dynamic API URL: automatically uses LAN IP when accessed from a non-localhost device.
// This means you NEVER need to manually change this file when switching between devices.
function getApiUrl(): string {
  try {
    const customApi = (window as any)?.process?.env?.API_URL || (globalThis as any)?.process?.env?.API_URL || (window as any)?.__env?.API_URL;
    if (customApi) return `${customApi}/admin`;
  } catch {}

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://dashkit-server.onrender.com/api/v1/admin';
    }
  }
  return 'http://localhost:3003/api/v1/admin';
}

function getPublicApiUrl(): string {
  try {
    const customApi = (window as any)?.process?.env?.API_URL || (globalThis as any)?.process?.env?.API_URL || (window as any)?.__env?.API_URL;
    if (customApi) return customApi;
  } catch {}

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://dashkit-server.onrender.com/api/v1';
    }
  }
  return 'http://localhost:3003/api/v1';
}

export const environment = {
  production: false,
  get apiUrl() { return getApiUrl(); },
  get publicApiUrl() { return getPublicApiUrl(); },
  firebase: {
    apiKey: "AIzaSyD45PhCDp-Dz2TfQEksmWGGfgf2A4FwkXM",
    authDomain: 'clothify-5610d.firebaseapp.com',
    projectId: 'clothify-5610d',
    storageBucket: 'clothify-5610d.firebasestorage.app',
    messagingSenderId: "679513619388",
    appId: "1:679513619388:web:73da0ee0f3c7a41ff389b9",
    measurementId: "G-W2C9TZQGEH"
  },
};
