"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { auth } from "./firebase";

interface AuthContextValue {
  user: User | null;
  loading: boolean;
  accessDenied: boolean;
  getToken: () => Promise<string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue>({
  user: null,
  loading: true,
  accessDenied: false,
  getToken: async () => "",
  logout: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [accessDenied, setAccessDenied] = useState(false);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      if (!firebaseUser) {
        setUser(null);
        setLoading(false);
        return;
      }

      try {
        const token = await firebaseUser.getIdToken();
        const res = await fetch("/api/gmail-accounts", {
          method: "GET",
          headers: { Authorization: `Bearer ${token}` },
        });

        if (res.status === 403) {
          setAccessDenied(true);
          await signOut(auth);
          setUser(null);
        } else {
          setUser(firebaseUser);
          setAccessDenied(false);
        }
      } catch {
        setUser(firebaseUser);
      } finally {
        setLoading(false);
      }
    });

    return () => unsub();
  }, []);

  async function getToken(): Promise<string> {
    if (!auth.currentUser) throw new Error("Not signed in.");
    return auth.currentUser.getIdToken();
  }

  async function logout() {
    await signOut(auth);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ user, loading, accessDenied, getToken, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
