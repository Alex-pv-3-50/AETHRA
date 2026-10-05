import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api, getToken, setToken } from '../api/client.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // При старте — восстанавливаем сессию по JWT из localStorage
  useEffect(() => {
    (async () => {
      if (!getToken()) return setLoading(false);
      try {
        const { user } = await api('/auth/me');
        setUser(user);
      } catch {
        setToken(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = async (email, password) => {
    const data = await api('/auth/login', { method: 'POST', body: { email, password }, auth: false });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const register = async (name, email, password) => {
    const data = await api('/auth/register', {
      method: 'POST',
      body: { name, email, password },
      auth: false,
    });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
  };

  const saveAddresses = async (addresses) => {
    const data = await api('/auth/addresses', { method: 'PATCH', body: { addresses } });
    setUser(data.user);
  };

  const value = useMemo(
    () => ({ user, loading, login, register, logout, saveAddresses }),
    [user, loading]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => useContext(AuthContext);
