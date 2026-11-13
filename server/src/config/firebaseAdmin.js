/**
 * Firebase Admin initialization module.
 * Supports:
 *  - FIREBASE_SERVICE_ACCOUNT_KEY (JSON string or path to serviceAccountKey.json)
 *  - FIREBASE_SERVICE_ACCOUNT_PATH (path to serviceAccountKey.json)
 *  - GOOGLE_APPLICATION_CREDENTIALS (Application Default Credentials)
 *  - Optional FIREBASE_STORAGE_BUCKET for storing Wiki .md files in Firebase Storage
 * Falls back to local disk + in-memory storage if credentials are not configured.
 */
const fs = require('fs');
const path = require('path');

let admin = null;
let db = null;
let bucket = null;
let isConfigured = false;

function loadServiceAccount() {
  const rawKey = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
  const keyPath = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (rawKey) {
    const trimmed = rawKey.trim();
    if (trimmed.startsWith('{')) {
      return JSON.parse(trimmed);
    }
    const resolved = path.resolve(trimmed);
    if (fs.existsSync(resolved)) {
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
  }

  if (keyPath) {
    const resolved = path.resolve(keyPath.trim());
    if (fs.existsSync(resolved)) {
      return JSON.parse(fs.readFileSync(resolved, 'utf8'));
    }
  }

  return null;
}

try {
  const serviceAccount = loadServiceAccount();
  const hasADC = Boolean(process.env.GOOGLE_APPLICATION_CREDENTIALS);

  if (serviceAccount || hasADC) {
    const adminSdk = require('firebase-admin');
    const storageBucket =
      process.env.FIREBASE_STORAGE_BUCKET ||
      (serviceAccount?.project_id ? `${serviceAccount.project_id}.firebasestorage.app` : undefined);

    if (adminSdk.apps.length === 0) {
      const options = serviceAccount
        ? { credential: adminSdk.credential.cert(serviceAccount) }
        : { credential: adminSdk.credential.applicationDefault() };

      if (storageBucket) {
        options.storageBucket = storageBucket;
      }
      adminSdk.initializeApp(options);
    }

    admin = adminSdk;
    db = adminSdk.firestore();
    if (storageBucket) {
      try {
        bucket = adminSdk.storage().bucket(storageBucket);
      } catch (e) {
        console.warn('[Firebase Admin] Storage bucket init skipped:', e.message);
      }
    }
    isConfigured = true;
    console.log(
      `[Firebase Admin] Initialized (Firestore: active${bucket ? `, Storage: ${bucket.name}` : ''}).`
    );
  } else {
    console.log('[Firebase Admin] No service account found in env. Running in local disk + memory fallback mode.');
  }
} catch (error) {
  console.warn('[Firebase Admin] Initialization skipped or failed:', error.message);
  console.log('[Firebase Admin] Running in local disk + memory fallback mode.');
}

module.exports = {
  admin,
  db,
  bucket,
  isConfigured: () => isConfigured
};
