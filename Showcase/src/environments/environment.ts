// Environment configuration for Showcase UI
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

const getAdminUrl = (): string => {
  try {
    const envUrl = (window as any)?.process?.env?.ADMIN_URL || (globalThis as any)?.process?.env?.ADMIN_URL;
    if (envUrl) return envUrl;
  } catch {}

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://admin.dashkit.vercel.app';
    }
  }
  return 'http://localhost:4201';
};

const getDashboardUrl = (): string => {
  try {
    const envUrl = (window as any)?.process?.env?.DASHBOARD_URL || (globalThis as any)?.process?.env?.DASHBOARD_URL;
    if (envUrl) return envUrl;
  } catch {}

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname !== 'localhost' && hostname !== '127.0.0.1') {
      return 'https://dashboard.dashkit.vercel.app';
    }
  }
  return 'http://localhost:4200';
};

export const environment = {
  production: false,
  apiUrl: getApiUrl(),
  adminUrl: getAdminUrl(),
  dashboardUrl: getDashboardUrl()
};
