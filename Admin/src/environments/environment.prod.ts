function getApiUrl(): string {
  const customApi = (window as any)?.__env?.API_URL;
  if (customApi) return `${customApi}/admin`;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3003/api/v1/admin';
    }
  }
  return 'https://dashkit-server.onrender.com/api/v1/admin';
}

function getPublicApiUrl(): string {
  const customApi = (window as any)?.__env?.API_URL;
  if (customApi) return customApi;

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      return 'http://localhost:3003/api/v1';
    }
  }
  return 'https://dashkit-server.onrender.com/api/v1';
}

export const environment = {
  production: true,
  get apiUrl() { return getApiUrl(); },
  get publicApiUrl() { return getPublicApiUrl(); },
  firebase: {
    apiKey: 'AIzaSyD45PhCDp-Dz2TfQEksmWGGfgf2A4FwkXM',
    authDomain: 'clothify-5610d.firebaseapp.com',
    projectId: 'clothify-5610d',
    storageBucket: 'clothify-5610d.firebasestorage.app',
    messagingSenderId: '679513619388',
    appId: '1:679513619388:web:73da0ee0f3c7a41ff389b9',
    measurementId: 'G-W2C9TZQGEH',
  },
};
