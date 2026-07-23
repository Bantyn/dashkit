/**
 * Disable Zone.js patching of the `fetch` API.
 * This is required for Firebase Auth SDK to work correctly.
 * Zone.js's fetch wrapper prevents the SDK from reading
 * the response body of non-2xx responses, causing
 * auth/network-request-failed errors.
 */
const globalObj = (typeof global !== 'undefined' ? global : window) as any;

if (globalObj) {
  globalObj.__Zone_disable_fetch = true;
  console.log('Zone.js fetch patching disabled (Global/Window)');
}
