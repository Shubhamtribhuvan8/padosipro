import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { request } from "./api";
import { clearToken, loadToken, saveToken } from "./storage";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setToken] = useState(null);
  const [me, setMe] = useState(null);
  const [status, setStatus] = useState("booting");
  const [bootError, setBootError] = useState("");

  async function bootstrap() {
    setStatus("booting");
    setBootError("");
    try {
      const stored = await loadToken();
      if (!stored) {
        setToken(null);
        setMe(null);
        setStatus("ready");
        return;
      }
      const next = await request("/api/me", { token: stored });
      setToken(stored);
      setMe(next);
      setStatus("ready");
    } catch (error) {
      if (error.status === 401) {
        await clearToken();
        setToken(null);
        setMe(null);
        setStatus("ready");
        return;
      }
      setBootError(error.message);
      setStatus("error");
    }
  }

  useEffect(() => {
    bootstrap();
  }, []);

  const tokenRef = useRef(null);
  tokenRef.current = token;

  const acceptSession = useCallback(async (result) => {
    await saveToken(result.token);
    setToken(result.token);
    setMe({
      user: result.user,
      profile: result.profile,
      requests: result.requests ?? [],
    });
  }, []);

  const refresh = useCallback(async () => {
    const current = tokenRef.current;
    if (!current) return null;
    const next = await request("/api/me", { token: current });
    setMe(next);
    return next;
  }, []);

  const logout = useCallback(async () => {
    await clearToken();
    setToken(null);
    setMe(null);
  }, []);

  const value = useMemo(
    () => ({ token, me, setMe, status, bootError, acceptSession, refresh, logout, retry: bootstrap }),
    [token, me, status, bootError, acceptSession, refresh, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const value = useContext(AuthContext);
  if (!value) throw new Error("useAuth must be used inside AuthProvider");
  return value;
}
