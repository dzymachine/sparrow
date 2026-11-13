/**
 * Firebase Admin initialization module.
 * Falls back to local in-memory storage if credentials are not configured yet.
 */

let admin = null;
let isConfigured = false;

try {
  if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    // Attempt initialization if credentials provided
    const adminSdk = require('firebase-admin');
    const serviceAccount = typeof process.env.FIREBASE_SERVICE_ACCOUNT_KEY === 'string'
      ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
      : process.env.FIREBASE_SERVICE_ACCOUNT_KEY;

    adminSdk.initializeApp({
      credential: adminSdk.credential.cert(serviceAccount)
    });
    admin = adminSdk;
    isConfigured = true;
    console.log('[Firebase Admin] Successfully initialized with service account.');
  } else {
    console.log('[Firebase Admin] No service account key found in env. Running in memory-store fallback mode.');
  }
} catch (error) {
  console.warn('[Firebase Admin] Initialization skipped or failed:', error.message);
  console.log('[Firebase Admin] Running in memory-store fallback mode.');
}

module.exports = {
  admin,
  isConfigured: () => isConfigured
};
