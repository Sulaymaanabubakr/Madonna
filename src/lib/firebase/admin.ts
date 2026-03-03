import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

// Lazy initialization guarantees dotenv has loaded env vars before Firebase Admin reads them.
let initialized = false;
let authInstance: ReturnType<typeof getAuth> | null = null;
let dbInstance: ReturnType<typeof getFirestore> | null = null;

function ensureInitialized() {
  if (initialized) return;
  initialized = true;

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || "";

  const privateKey = rawPrivateKey
    .replace(/^['"]|['"]$/g, "")
    .replace(/\\\\n/g, "\n")
    .replace(/\\n/g, "\n")
    .replace(/\r\n/g, "\n")
    .trim();

  if (!getApps().length) {
    if (projectId && clientEmail && privateKey) {
      try {
        initializeApp({
          credential: cert({ projectId, clientEmail, privateKey }),
        });
      } catch (error) {
        throw new Error(`Firebase Admin initialization failed. ${(error as Error).message}`);
      }
    } else {
      if (process.env.NODE_ENV === "production") {
        throw new Error("Missing Firebase Admin environment variables");
      }
      initializeApp({ credential: applicationDefault() });
    }
  }

  authInstance = getAuth();
  dbInstance = getFirestore();
}

// Explicit getters — Firebase Admin is initialized on first access.
// This is the most reliable way to avoid 'this' context issues and
// guarantee dotenv has already loaded the env vars.
export function getAdminAuth() {
  ensureInitialized();
  return authInstance!;
}

export function getAdminDb() {
  ensureInitialized();
  return dbInstance!;
}

