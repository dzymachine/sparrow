/**
 * Firebase Admin initialization module.
 * Support credentials from:
 * 1. FIREBASE_SERVICE_ACCOUNT_PATH (file path to serviceAccountKey.json)
 * 2. FIREBASE_SERVICE_ACCOUNT_KEY (JSON string or object)
 * 3. GOOGLE_APPLICATION_CREDENTIALS / Application Default Credentials
 *
 * Falls back gracefully to local disk/memory storage if credentials are missing or invalid.
 */

const fs = require('fs');
const path = require('path');

let admin = null;
let db = null;
let storage = null;
let isConfigured = false;
let bucketName = null;

try {
  const adminSdk = require('firebase-admin');

  if (adminSdk.apps.length > 0) {
    admin = adminSdk.app();
    isConfigured = true;
  } else {
    let credential = null;
    const keyEnv = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    const pathEnv = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

    if (pathEnv) {
      const resolvedPath = path.isAbsolute(pathEnv)
        ? pathEnv
        : path.resolve(process.cwd(), pathEnv);

      if (fs.existsSync(resolvedPath)) {
        const rawJson = fs.readFileSync(resolvedPath, 'utf8');
        credential = adminSdk.credential.cert(JSON.parse(rawJson));
      } else {
        console.warn(`[Firebase Admin] Service account file not found at: ${resolvedPath}`);
      }
    }

    if (!credential && keyEnv) {
      try {
        const parsedKey = typeof keyEnv === 'string' ? JSON.parse(keyEnv) : keyEnv;
        credential = adminSdk.credential.cert(parsedKey);
      } catch (e) {
        console.warn('[Firebase Admin] Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY JSON string.');
      }
    }

    if (!credential && process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      credential = adminSdk.credential.applicationDefault();
    }

    if (credential) {
      bucketName = process.env.FIREBASE_STORAGE_BUCKET || null;
      const appConfig = { credential };
      if (bucketName) {
        appConfig.storageBucket = bucketName;
      }

      admin = adminSdk.initializeApp(appConfig);
      isConfigured = true;
    }
  }

  if (isConfigured && admin) {
    db = admin.firestore();
    if (bucketName) {
      try {
        storage = admin.storage().bucket(bucketName);
      } catch (err) {
        console.warn('[Firebase Admin] Storage bucket init error:', err.message);
      }
    } else {
      try {
        storage = admin.storage().bucket();
      } catch (err) {
        // Bucket not explicitly provided
      }
    }

    const storageLabel = bucketName || (storage ? 'default' : 'disabled');
    console.log(`[Firebase Admin] Initialized (Firestore: active, Storage: ${storageLabel}).`);
  } else {
    console.log('[Firebase Admin] No Firebase service account configured. Running in memory/local-disk fallback mode.');
  }
} catch (error) {
  console.warn('[Firebase Admin] Initialization skipped or failed:', error.message);
  console.log('[Firebase Admin] Running in memory/local-disk fallback mode.');
}

module.exports = {
  admin,
  db,
  storage,
  getBucket: () => storage,
  isConfigured: () => isConfigured
};
