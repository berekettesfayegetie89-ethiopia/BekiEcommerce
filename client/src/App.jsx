import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { WishlistProvider } from './context/WishlistContext';
import Layout from './components/Layout';
import Home from './pages/Home';
import Products from './pages/Products';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Orders from './pages/Orders';
import OrderDetail from './pages/OrderDetail';
import Wishlist from './pages/Wishlist';
import Profile from './pages/Profile';
import Login from './pages/Login';
import Signup from './pages/Signup';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import AdminProducts from './admin/pages/AdminProducts';
import ProductForm from './admin/pages/ProductForm';
import AdminOrders from './admin/pages/AdminOrders';
import AdminUsers from './admin/pages/AdminUsers';
import AdminCarts from './admin/pages/AdminCarts';
import AdminCoupons from './admin/pages/AdminCoupons';

function Guard({ admin = false, children }) {
  const { user, loading } = useAuth();
  if (loading) return <div className="min-h-screen bg-az-bg dark:bg-dk-bg" />;
  if (!user) return <Navigate to="/login" replace />;
  if (admin && !user.isAdmin) return <Navigate to="/" replace />;
  return children;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <CartProvider>
            <WishlistProvider>
              <Toaster position="top-right" toastOptions={{ duration: 3000, style: { background: '#232f3e', color: '#fff', fontSize: '14px', borderRadius: '6px' }, success: { iconTheme: { primary: '#ff9900', secondary: '#fff' } } }} />
              <Routes>
                <Route element={<Layout />}>
                  <Route path="/" element={<Home />} />
                  <Route path="/products" element={<Products />} />
                  <Route path="/products/:id" element={<ProductDetail />} />
                  <Route path="/login" element={<Login />} />
                  <Route path="/signup" element={<Signup />} />
                  <Route path="/forgot-password" element={<ForgotPassword />} />
                  <Route path="/reset-password/:token" element={<ResetPassword />} />
                  <Route path="/cart" element={<Guard><Cart /></Guard>} />
                  <Route path="/checkout" element={<Guard><Checkout /></Guard>} />
                  <Route path="/order-success/:id" element={<Guard><OrderSuccess /></Guard>} />
                  <Route path="/orders" element={<Guard><Orders /></Guard>} />
                  <Route path="/orders/:id" element={<Guard><OrderDetail /></Guard>} />
                  <Route path="/wishlist" element={<Guard><Wishlist /></Guard>} />
                  <Route path="/profile" element={<Guard><Profile /></Guard>} />
                </Route>
                <Route path="/admin" element={<Guard admin><AdminLayout /></Guard>}>
                  <Route index element={<Dashboard />} />
                  <Route path="products" element={<AdminProducts />} />
                  <Route path="products/new" element={<ProductForm />} />
                  <Route path="products/:id/edit" element={<ProductForm />} />
                  <Route path="orders" element={<AdminOrders />} />
                  <Route path="users" element={<AdminUsers />} />
                  <Route path="carts" element={<AdminCarts />} />
                  <Route path="coupons" element={<AdminCoupons />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </WishlistProvider>
          </CartProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
