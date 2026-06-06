import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart]           = useState({ items: [] });
  const [cartLoading, setCartLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setCartLoading(true);
      api.get('/cart')
        .then(({ data }) => setCart(data || { items: [] }))
        .catch(() => setCart({ items: [] }))
        .finally(() => setCartLoading(false));
    } else {
      setCart({ items: [] });
    }
  }, [user]);

  // addToCart re-throws so callers can show the real server message
  const addToCart = async (productId, quantity = 1, selectedVariant = null) => {
    const { data } = await api.post('/cart', { productId, quantity, selectedVariant });
    setCart(data);
  };

  const updateQuantity = async (itemId, quantity) => {
    const { data } = await api.put(`/cart/${itemId}`, { quantity });
    setCart(data);
  };

  const removeItem = async (itemId) => {
    const { data } = await api.delete(`/cart/${itemId}`);
    setCart(data);
  };

  const clearCart = async () => {
    await api.delete('/cart');
    setCart({ items: [] });
  };

  const cartCount = (cart.items || []).reduce((s, i) => s + i.quantity, 0);
  const cartTotal = (cart.items || []).reduce(
    (s, i) => s + Number(i.product?.price || 0) * i.quantity, 0
  );

  return (
    <Ctx.Provider value={{ cart, cartLoading, cartCount, cartTotal, addToCart, updateQuantity, removeItem, clearCart }}>
      {children}
    </Ctx.Provider>
  );
}

export const useCart = () => useContext(Ctx);
