

import {
  User,
} from "firebase/auth";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { getAuthClient, isFirebaseConfigured } from "@/lib/firebase/client";
import { fetchUserProfile, saveUserProfile } from "@/lib/firestore";
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

const authFallback: AuthContextType = {
  enabled: false,
  user: null,
  profile: null,
  loading: false,
  register: async () => {
    throw new Error("Auth provider unavailable");
  },
  login: async () => {
    throw new Error("Auth provider unavailable");
  },
  loginWithGoogle: async () => {
    throw new Error("Auth provider unavailable");
  },
  logout: async () => undefined,
  getToken: async () => null,
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    let unsub: (() => void) | undefined;
    let cancelled = false;

    const init = async () => {
      const auth = await getAuthClient();
      if (!auth) {
        if (!cancelled) setLoading(false);
        return;
      }

      const { onAuthStateChanged } = await import("firebase/auth");

      unsub = onAuthStateChanged(auth, async (firebaseUser) => {
        if (cancelled) return;
        setUser(firebaseUser);

        if (firebaseUser) {
          const fallback: UserProfile = {
            uid: firebaseUser.uid,
            name: firebaseUser.displayName || firebaseUser.email?.split("@")[0] || "Customer",
            email: firebaseUser.email || "",
            role: "customer",
            createdAt: new Date().toISOString(),
          };
          const stored = await fetchUserProfile(firebaseUser.uid);
          const finalProfile = stored ?? fallback;

          // Seeded Admin Email
          if (firebaseUser.email === "madonnaexpresslinkventure@gmail.com") {
            finalProfile.role = "admin";
          }

          setProfile(finalProfile);
        } else {
          setProfile(null);
        }

        setLoading(false);
      });
    };

    init().catch(() => setLoading(false));

    return () => {
      cancelled = true;
      if (unsub) unsub();
    };
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const auth = await getAuthClient();
    if (!auth) throw new Error("Firebase Auth is not configured");
    const { createUserWithEmailAndPassword, updateProfile } = await import("firebase/auth");
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    await updateProfile(cred.user, { displayName: name });
    await saveUserProfile(cred.user.uid, { name, email });
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const auth = await getAuthClient();
    if (!auth) throw new Error("Firebase Auth is not configured");
    const { signInWithEmailAndPassword } = await import("firebase/auth");
    await signInWithEmailAndPassword(auth, email, password);
  }, []);

  const loginWithGoogle = useCallback(async () => {
    const auth = await getAuthClient();
    if (!auth) throw new Error("Firebase Auth is not configured");
    const { GoogleAuthProvider, signInWithPopup } = await import("firebase/auth");
    await signInWithPopup(auth, new GoogleAuthProvider());
  }, []);

  const logout = useCallback(async () => {
    const auth = await getAuthClient();
    if (!auth) return;
    const { signOut } = await import("firebase/auth");
    await signOut(auth);
  }, []);

  const getToken = useCallback(async () => {
    const auth = await getAuthClient();
    if (!auth) return null;
    if (!auth.currentUser) return null;
    return auth.currentUser.getIdToken();
  }, []);

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
    [user, profile, loading, register, login, loginWithGoogle, logout, getToken],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  return ctx ?? authFallback;
}
