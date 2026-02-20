"use client";

import {
  GoogleAuthProvider,
  User,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  updateProfile,
} from "firebase/auth";
import { doc, getDoc, serverTimestamp, setDoc } from "firebase/firestore";
import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { auth, db, isFirebaseConfigured } from "@/lib/firebase/client";
import type { UserProfile } from "@/types";

type AuthContextType = {
  enabled: boolean;
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  register: (name: string, email: string, password: string) => Promise<void>;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
  getToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured || !auth || !db) {
      setLoading(false);
      return;
    }

    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);

      if (firebaseUser) {
        const profileRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(profileRef);

        if (!snap.exists()) {
          const payload = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Customer",
            email: firebaseUser.email || "",
            role: "customer",
            createdAt: new Date().toISOString(),
            createdAtServer: serverTimestamp(),
          };
          await setDoc(profileRef, payload, { merge: true });
          setProfile(payload as UserProfile);
        } else {
          setProfile(snap.data() as UserProfile);
        }
      } else {
        setProfile(null);
      }

      setLoading(false);
    });

    return () => unsub();
  }, []);

  const register = async (name: string, email: string, password: string) => {
    if (!auth || !db) throw new Error("Firebase Auth is not configured");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await setDoc(
      doc(db, "users", cred.user.uid),
      {
        uid: cred.user.uid,
        name,
        email,
        role: "customer",
        createdAt: new Date().toISOString(),
        createdAtServer: serverTimestamp(),
      },
      { merge: true },
    );
  };

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error("Firebase Auth is not configured");
    await signInWithEmailAndPassword(auth, email, password);
  };

  const loginWithGoogle = async () => {
    if (!auth) throw new Error("Firebase Auth is not configured");
    await signInWithPopup(auth, new GoogleAuthProvider());
  };

  const logout = async () => {
    if (!auth) return;
    await signOut(auth);
  };

  const getToken = async () => {
    if (!auth) return null;
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  };

  const value = useMemo(
    () => ({
      enabled: isFirebaseConfigured,
      user,
      profile,
      loading,
      register,
      login,
      loginWithGoogle,
      logout,
      getToken,
    }),
    [user, profile, loading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
