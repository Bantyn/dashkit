declare const process: any;

// Production Environment configuration for Showcase UI
export const environment = {
  production: true,
  apiUrl: (typeof process !== 'undefined' && process && process.env && process.env['API_URL']) 
    ? process.env['API_URL'] 
    : 'http://localhost:3003/api/v1'
};
