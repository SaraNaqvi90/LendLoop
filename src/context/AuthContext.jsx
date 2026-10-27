import { createContext, useContext, useEffect, useState } from 'react';
import { api, setAccessToken } from '../services/api';
const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { (async () => { try { const { accessToken } = await api('/auth/refresh', { method: 'POST' }); setAccessToken(accessToken); setUser(await api('/users/me')); } catch { setAccessToken(''); } finally { setLoading(false); } })(); }, []);
  async function login(email, password) { const data = await api('/auth/login', { method: 'POST', body: { email, password } }); setAccessToken(data.accessToken); setUser(data.user); }
  async function signup(form) { const data = await api('/auth/register', { method: 'POST', body: form }); setAccessToken(data.accessToken); setUser(data.user); }
  async function logout() { try { await api('/auth/logout', { method: 'POST' }); } finally { setAccessToken(''); setUser(null); } }
  return <AuthContext.Provider value={{ user, setUser, loading, login, signup, logout }}>{children}</AuthContext.Provider>;
}
