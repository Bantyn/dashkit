// Production Environment configuration for Showcase UI
const getApiUrl = (): string => {
  try {
    const envUrl = (window as any)?.process?.env?.API_URL || (globalThis as any)?.process?.env?.API_URL;
    if (envUrl) return envUrl;
  } catch {}

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://dashkit-server.onrender.com/api/v1';
    }
  }
  return 'http://localhost:3003/api/v1';
};

export const environment = {
  production: true,
  apiUrl: getApiUrl()
};
