import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
const Ctx = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = localStorage.getItem('token'), u = localStorage.getItem('user');
    if (t && u) { try { setUser(JSON.parse(u)); } catch {} }
    setLoading(false);
  }, []);
  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user); return data.user;
  };
  const register = async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password });
    localStorage.setItem('token', data.token); localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user); return data.user;
  };
  const logout = () => { localStorage.removeItem('token'); localStorage.removeItem('user'); setUser(null); };
  const updateUser = (u) => { localStorage.setItem('user', JSON.stringify(u)); setUser(u); };
  return <Ctx.Provider value={{ user, loading, login, register, logout, updateUser }}>{children}</Ctx.Provider>;
}
export const useAuth = () => useContext(Ctx);
