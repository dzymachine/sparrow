import admin from "firebase-admin";

function initFirebase() {
  if (admin.apps.length) return admin.app();
  if (!process.env.FIREBASE_PROJECT_ID) return null;

  return admin.initializeApp({
    credential: admin.credential.applicationDefault(),
    projectId: process.env.FIREBASE_PROJECT_ID,
  });
}

export const firebaseApp = initFirebase();
export const auth = firebaseApp ? admin.auth() : null;
