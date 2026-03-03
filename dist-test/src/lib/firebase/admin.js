"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getAdminAuth = getAdminAuth;
exports.getAdminDb = getAdminDb;
var app_1 = require("firebase-admin/app");
var auth_1 = require("firebase-admin/auth");
var firestore_1 = require("firebase-admin/firestore");
// Lazy initialization guarantees dotenv has loaded env vars before Firebase Admin reads them.
var initialized = false;
var authInstance = null;
var dbInstance = null;
function ensureInitialized() {
    if (initialized)
        return;
    initialized = true;
    var projectId = process.env.FIREBASE_PROJECT_ID;
    var clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
    var rawPrivateKey = process.env.FIREBASE_PRIVATE_KEY || "";
    var privateKey = rawPrivateKey
        .replace(/^['"]|['"]$/g, "")
        .replace(/\\\\n/g, "\n")
        .replace(/\\n/g, "\n")
        .replace(/\r\n/g, "\n")
        .trim();
    if (!(0, app_1.getApps)().length) {
        if (projectId && clientEmail && privateKey) {
            try {
                (0, app_1.initializeApp)({
                    credential: (0, app_1.cert)({ projectId: projectId, clientEmail: clientEmail, privateKey: privateKey }),
                });
            }
            catch (error) {
                throw new Error("Firebase Admin initialization failed. ".concat(error.message));
            }
        }
        else {
            if (process.env.NODE_ENV === "production") {
                throw new Error("Missing Firebase Admin environment variables");
            }
            (0, app_1.initializeApp)({ credential: (0, app_1.applicationDefault)() });
        }
    }
    authInstance = (0, auth_1.getAuth)();
    dbInstance = (0, firestore_1.getFirestore)();
}
// Explicit getters — Firebase Admin is initialized on first access.
// This is the most reliable way to avoid 'this' context issues and
// guarantee dotenv has already loaded the env vars.
function getAdminAuth() {
    ensureInitialized();
    return authInstance;
}
function getAdminDb() {
    ensureInitialized();
    return dbInstance;
}
