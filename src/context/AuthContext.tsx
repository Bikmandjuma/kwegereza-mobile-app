import { createContext, useCallback, useContext, useEffect, useMemo, useState, ReactNode } from "react";
import { getToken, setToken, ApiError } from "../api/client";
import { loginRequest, meRequest } from "../api/auth";

export type User = {
  id: string;
  fullName: string;
  email: string;
  role: string;
  gender: string | null;
  permissions: string[];
  [key: string]: unknown;
};

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  // true until the very first "do we have a valid session" check
  // resolves -- the splash/loading gate (see SplashGate) stays up for
  // at least this long regardless of the 5-second minimum, so a slow
  // network never flashes a logged-out screen before correcting itself.
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const token = await getToken();
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await meRequest();
        if (!cancelled) setUser(res.data as User);
      } catch {
        // Stored token is stale/invalid -- clear it rather than leave a
        // dead token around that will just fail the same way on every
        // future launch.
        await setToken(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await loginRequest(email, password);
    await setToken(res.data.token);
    setUser(res.data.user as User);
  }, []);

  const logout = useCallback(async () => {
    await setToken(null);
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ApiError };
