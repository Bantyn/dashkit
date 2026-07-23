declare const process: any;

// Environment configuration for Showcase UI
export const environment = {
  production: false,
  apiUrl: (typeof process !== 'undefined' && process && process.env && process.env['API_URL']) 
    ? process.env['API_URL'] 
    : 'http://localhost:3003/api/v1'
};
