// Environment configuration for Showcase UI
const getProcessEnvApiUrl = (): string | undefined => {
  try {
    return (window as any)?.process?.env?.API_URL || (globalThis as any)?.process?.env?.API_URL;
  } catch {
    return undefined;
  }
};

export const environment = {
  production: false,
  apiUrl: getProcessEnvApiUrl() || 'http://localhost:3003/api/v1'
};
