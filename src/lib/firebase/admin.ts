import { applicationDefault, cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

const projectId = process.env.FIREBASE_PROJECT_ID;
const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
const rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || "";
// Normalize the private key regardless of how Vercel encodes it:
// 1. Strip surrounding quotes (single or double)
// 2. Replace literal \\n (double-escaped by some platforms) → \n
// 3. Replace \n escape sequences → real newlines
// 4. Normalize CRLF to LF
const privateKey = rawPrivateKey
  .replace(/^['"]|['"]$/g, "") // strip leading/trailing quotes
  .replace(/\\\\n/g, "\n")     // double-escaped \\n → newline
  .replace(/\\n/g, "\n")       // single-escaped \n → newline
  .replace(/\r\n/g, "\n")      // windows newlines -> unix
  .trim();

if (!getApps().length) {
  if (projectId && clientEmail && privateKey) {
    try {
      initializeApp({
        credential: cert({ projectId, clientEmail, privateKey }),
      });
    } catch (error) {
      throw new Error(
        `Firebase Admin initialization failed. Check FIREBASE_PRIVATE_KEY format. ${(error as Error).message}`,
      );
    }
  } else {
    // Local dev fallback only; production should always use explicit service account env vars.
    if (process.env.NODE_ENV === "production") {
      const missing = [
        !projectId ? "FIREBASE_PROJECT_ID" : "",
        !clientEmail ? "FIREBASE_CLIENT_EMAIL" : "",
        !privateKey ? "FIREBASE_PRIVATE_KEY" : "",
      ].filter(Boolean);
      throw new Error(`Missing Firebase Admin environment variables: ${missing.join(", ")}`);
    }
    initializeApp({ credential: applicationDefault() });
  }
}

export const adminAuth = getAuth();
export const adminDb = getFirestore();
