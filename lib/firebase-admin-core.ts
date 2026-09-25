import { cert, getApp, getApps, initializeApp, type App } from "firebase-admin/app";
import { getFirestore, type Firestore } from "firebase-admin/firestore";
import { getStorage, type Storage } from "firebase-admin/storage";

export function hasFirebaseAdminCredentials() {
  return Boolean(
    process.env.FIREBASE_ADMIN_PROJECT_ID?.trim()
    && process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim()
    && process.env.FIREBASE_ADMIN_PRIVATE_KEY?.trim(),
  );
}

function normalizePrivateKey(value: string | undefined) {
  const key = value?.trim();
  if (!key) return undefined;

  const unquoted = key.startsWith("\"") && key.endsWith("\"")
    ? key.slice(1, -1)
    : key;

  return unquoted.replace(/\\n/g, "\n").replace(/\r\n/g, "\n");
}

/** Admin SDK is deliberately initialized on demand so public pages build without server credentials. */
export function getFirebaseAdminApp(): App {
  const projectId = process.env.FIREBASE_ADMIN_PROJECT_ID?.trim();
  const clientEmail = process.env.FIREBASE_ADMIN_CLIENT_EMAIL?.trim();
  const privateKey = normalizePrivateKey(process.env.FIREBASE_ADMIN_PRIVATE_KEY);
  if (!hasFirebaseAdminCredentials()) {
    throw new Error(
      "Missing Firebase Admin credentials. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, and FIREBASE_ADMIN_PRIVATE_KEY.",
    );
  }
  return getApps().length
    ? getApp()
    : initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
        storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
      });
}

export function getAdminFirestore(): Firestore {
  return getFirestore(getFirebaseAdminApp());
}

export function getAdminStorage(): Storage {
  return getStorage(getFirebaseAdminApp());
}

// Backwards-compatible names for the seed package. They are lazy proxies, not initialized at import time.
export const adminFirestore = new Proxy({} as Firestore, {
  get: (_target, property) => {
    const value = Reflect.get(getAdminFirestore() as object, property);
    return typeof value === "function" ? value.bind(getAdminFirestore()) : value;
  },
});
export const adminStorage = new Proxy({} as Storage, {
  get: (_target, property) => {
    const value = Reflect.get(getAdminStorage() as object, property);
    return typeof value === "function" ? value.bind(getAdminStorage()) : value;
  },
});
export const firebaseAdminApp = new Proxy({} as App, {
  get: (_target, property) => {
    const value = Reflect.get(getFirebaseAdminApp() as object, property);
    return typeof value === "function" ? value.bind(getFirebaseAdminApp()) : value;
  },
});
