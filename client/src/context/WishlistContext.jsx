import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';
const Ctx = createContext(null);
export function WishlistProvider({ children }) {
  const { user } = useAuth();
  const [wishlist, setWishlist] = useState({ products: [] });
  useEffect(() => {
    if (user) api.get('/wishlist').then(({ data }) => setWishlist(data || { products: [] })).catch(() => {});
    else setWishlist({ products: [] });
  }, [user]);
  const toggle = async (productId) => {
    const isIn = (wishlist.products || []).some(p => (p.id || p) === productId);
    const { data } = isIn ? await api.delete(`/wishlist/${productId}`) : await api.post(`/wishlist/${productId}`);
    setWishlist(data);
    return !isIn;
  };
  const isWishlisted = (productId) => (wishlist.products || []).some(p => (p.id || p)?.toString() === productId?.toString());
  return <Ctx.Provider value={{ wishlist, toggle, isWishlisted }}>{children}</Ctx.Provider>;
}
export const useWishlist = () => useContext(Ctx);
