import { FirebaseApp, getApp, getApps, initializeApp } from "firebase/app";
import type { Auth } from "firebase/auth";
import type { Firestore } from "firebase/firestore";

type ViteImportMeta = ImportMeta & {
  env?: Record<string, string | undefined>;
};

const viteEnv = (import.meta as ViteImportMeta).env || {};

const readEnv = (key: string) => {
  const maybeProcess = globalThis as typeof globalThis & {
    process?: { env?: Record<string, string | undefined> };
  };
  return viteEnv[key] || maybeProcess.process?.env?.[key];
};

const firebaseConfig = {
  apiKey: readEnv("VITE_FIREBASE_API_KEY"),
  authDomain: readEnv("VITE_FIREBASE_AUTH_DOMAIN"),
  projectId: readEnv("VITE_FIREBASE_PROJECT_ID"),
  storageBucket: readEnv("VITE_FIREBASE_STORAGE_BUCKET"),
  messagingSenderId: readEnv("VITE_FIREBASE_MESSAGING_SENDER_ID"),
  appId: readEnv("VITE_FIREBASE_APP_ID"),
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey &&
    firebaseConfig.authDomain &&
    firebaseConfig.projectId &&
    firebaseConfig.appId,
);

let app: FirebaseApp | null = null;
if (typeof window !== "undefined" && isFirebaseConfigured) {
  app = getApps().length ? getApp() : initializeApp(firebaseConfig);
}

let authInstance: Auth | null | undefined;
let dbInstance: Firestore | null | undefined;

export async function getAuthClient(): Promise<Auth | null> {
  if (typeof window === "undefined" || !app) return null;
  if (authInstance !== undefined) return authInstance;
  const { getAuth } = await import("firebase/auth");
  authInstance = getAuth(app);
  return authInstance;
}

export async function getDbClient(): Promise<Firestore | null> {
  if (typeof window === "undefined" || !app) return null;
  if (dbInstance !== undefined) return dbInstance;
  const { getFirestore } = await import("firebase/firestore");
  dbInstance = getFirestore(app);
  return dbInstance;
}
