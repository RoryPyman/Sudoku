import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { authApi } from '../api/auth.js';
import { setAccessToken, clearAccessToken } from '../api/client.js';

const AuthContext = createContext(null);

/**
 * AuthProvider — wraps the whole app.
 * On mount it attempts a silent refresh using the httpOnly cookie so that a
 * hard page-reload re-hydrates the session without requiring re-login.
 */
export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true); // true until initial refresh resolves

  useEffect(() => {
    authApi.refresh()
      .then(({ accessToken, user: u }) => {
        setAccessToken(accessToken);
        setUser(u);
      })
      .catch(() => {
        // No valid session — anonymous
        clearAccessToken();
        setUser(null);
      })
      .finally(() => setLoading(false));
  }, []);

  const login = useCallback(async (identifier, password) => {
    const { accessToken, user: u } = await authApi.login(identifier, password);
    setAccessToken(accessToken);
    setUser(u);
  }, []);

  const register = useCallback(async (fields) => {
    const { accessToken, user: u } = await authApi.register(fields);
    setAccessToken(accessToken);
    setUser(u);
  }, []);

  const logout = useCallback(async () => {
    await authApi.logout().catch(() => {});
    clearAccessToken();
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside <AuthProvider>');
  return ctx;
}
