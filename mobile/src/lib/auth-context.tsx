import React, { createContext, useContext, useEffect, useState } from "react";
import { api, ApiError } from "./api";
import {
  getAuthToken,
  setAuthToken,
  removeAuthToken,
  getStoredUser,
  setStoredUser,
  clearAuth,
} from "./auth-storage";
import { User } from "../types/api";

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
}

interface AuthContextValue extends AuthState {
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    loading: true,
  });

  useEffect(() => {
    (async () => {
      try {
        const [token, user] = await Promise.all([
          getAuthToken(),
          getStoredUser(),
        ]);
        if (token && user) {
          setState({ user, token, loading: false });
          // Verify token is still valid in background
          try {
            const { user: fresh } = await api.auth.me();
            await setStoredUser(fresh);
            setState({ user: fresh, token, loading: false });
          } catch {
            await clearAuth();
            setState({ user: null, token: null, loading: false });
          }
        } else {
          setState({ user: null, token: null, loading: false });
        }
      } catch {
        setState({ user: null, token: null, loading: false });
      }
    })();
  }, []);

  const login = async (email: string, password: string) => {
    const res = await api.auth.login(email, password);
    await Promise.all([setAuthToken(res.token), setStoredUser(res.user)]);
    setState({ user: res.user, token: res.token, loading: false });
  };

  const signup = async (name: string, email: string, password: string) => {
    const res = await api.auth.signup({ name, email, password });
    if (res.token && res.user) {
      await Promise.all([setAuthToken(res.token), setStoredUser(res.user)]);
      setState({ user: res.user, token: res.token, loading: false });
    }
  };

  const logout = async () => {
    await clearAuth();
    setState({ user: null, token: null, loading: false });
  };

  return (
    <AuthContext.Provider value={{ ...state, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
