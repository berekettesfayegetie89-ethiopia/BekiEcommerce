import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';

const CATS = ['Electronics','Clothing','Home','Sports','Books','Beauty','Toys','Automotive'];

function SunIcon() {
  return <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>;
}
function MoonIcon() {
  return <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z"/></svg>;
}
function CartIcon() {
  return <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 24 24"><path d="M6 2H3a1 1 0 000 2h1.22l2.27 9.09A3 3 0 007 15h11a1 1 0 000-2H7.76L7.5 12H19a1 1 0 00.97-.757l1.5-6A1 1 0 0020.5 4H5.28L4.72 2H3v0zM7 18a2 2 0 104 0 2 2 0 00-4 0zM16 18a2 2 0 104 0 2 2 0 00-4 0z"/></svg>;
}

export default function Navbar() {
  const { user, logout } = useAuth();
  const { cartCount } = useCart();
  const { isDark, toggleTheme } = useTheme();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) { navigate(`/products?search=${encodeURIComponent(search.trim())}`); setSearch(''); }
  };
  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); setMenuOpen(false); };

  return (
    <>
      {/* Main bar */}
      <header className="bg-az-dark sticky top-0 z-50">
        <div className="max-w-[1500px] mx-auto px-4 h-14 flex items-center gap-3">
          {/* Logo */}
          <Link to="/" className="shrink-0 flex items-center gap-0.5 border-2 border-transparent hover:border-white rounded px-1 py-1 transition-colors">
            <span className="text-white font-bold text-xl">Shop</span>
            <span className="text-az-orange font-bold text-xl">Sphere</span>
          </Link>

          {/* Deliver */}
          <div className="hidden lg:flex flex-col border-2 border-transparent hover:border-white rounded px-1 py-0.5 cursor-pointer transition-colors shrink-0">
            <span className="text-[11px] text-gray-400">Deliver to</span>
            <span className="text-white font-bold text-sm">United States</span>
          </div>

          {/* Search */}
          <form onSubmit={handleSearch} className="flex-1 flex">
            <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products, brands..."
              className="flex-1 px-4 py-2 text-az-text rounded-l bg-white text-sm focus:outline-none focus:ring-2 focus:ring-az-orange border-0" />
            <button type="submit" className="bg-az-yellow hover:bg-az-hover px-4 rounded-r flex items-center transition-colors">
              <svg className="w-5 h-5 text-az-dark" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/></svg>
            </button>
          </form>

          {/* Theme toggle */}
          <button onClick={toggleTheme} title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
            className="shrink-0 text-white p-2 rounded border-2 border-transparent hover:border-white transition-colors">
            {isDark ? <SunIcon /> : <MoonIcon />}
          </button>

          {/* Account */}
          <div className="relative shrink-0">
            <button onClick={() => setMenuOpen(o => !o)}
              className="flex flex-col border-2 border-transparent hover:border-white rounded px-2 py-1 transition-colors">
              <span className="text-[11px] text-gray-400">{user ? `Hello, ${user.name.split(' ')[0]}` : 'Hello, sign in'}</span>
              <span className="text-white font-bold text-sm flex items-center gap-0.5">Account ▾</span>
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-full mt-1 w-64 bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded shadow-lg z-50 py-2"
                onMouseLeave={() => setMenuOpen(false)}>
                {!user ? (
                  <div className="px-4 py-3 border-b border-az-border dark:border-dk-border text-center">
                    <Link to="/login" onClick={() => setMenuOpen(false)} className="btn-primary w-full block text-center text-sm mb-2">Sign In</Link>
                    <p className="text-xs text-az-muted dark:text-dk-sub">New? <Link to="/signup" onClick={() => setMenuOpen(false)} className="link">Create account</Link></p>
                  </div>
                ) : (
                  <div className="px-4 py-2 border-b border-az-border dark:border-dk-border">
                    <p className="font-bold text-az-text dark:text-dk-text text-sm">{user.name}</p>
                    <p className="text-az-muted dark:text-dk-sub text-xs truncate">{user.email}</p>
                  </div>
                )}
                {user && (
                  <div className="py-1">
                    {[['👤 My Profile','/profile'],['📦 My Orders','/orders'],['❤️ Wishlist','/wishlist']].map(([l,to]) => (
                      <Link key={to} to={to} onClick={() => setMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-az-text dark:text-dk-text hover:bg-az-bg dark:hover:bg-dk-border transition-colors">{l}</Link>
                    ))}
                    {user.isAdmin && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)}
                        className="flex items-center px-4 py-2 text-sm text-az-orange font-bold hover:bg-az-bg dark:hover:bg-dk-border transition-colors">⚙️ Admin Panel</Link>
                    )}
                    <hr className="border-az-border dark:border-dk-border my-1" />
                    <button onClick={handleLogout} className="flex items-center w-full px-4 py-2 text-sm text-az-text dark:text-dk-text hover:bg-az-bg dark:hover:bg-dk-border transition-colors">
                      🚪 Sign Out
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Orders shortcut */}
          <Link to="/orders" className="hidden md:flex flex-col border-2 border-transparent hover:border-white rounded px-2 py-1 transition-colors shrink-0">
            <span className="text-[11px] text-gray-400">Returns</span>
            <span className="text-white font-bold text-sm">& Orders</span>
          </Link>

          {/* Cart */}
          <Link to="/cart" className="relative flex items-end gap-1 border-2 border-transparent hover:border-white rounded px-2 py-1 transition-colors shrink-0">
            <div className="relative text-white">
              <CartIcon />
              {cartCount > 0 && (
                <span className="absolute -top-1 left-5 bg-az-orange text-white text-[10px] font-bold min-w-[18px] h-[18px] rounded-full flex items-center justify-center px-1">
                  {cartCount > 99 ? '99+' : cartCount}
                </span>
              )}
            </div>
            <span className="text-white font-bold text-sm mb-1">Cart</span>
          </Link>
        </div>
      </header>

      {/* Sub nav */}
      <nav className="bg-az-nav">
        <div className="max-w-[1500px] mx-auto px-4 h-9 flex items-center gap-0.5 overflow-x-auto">
          <span className="text-white font-bold text-sm px-3 py-1 border border-white/40 rounded mr-1 shrink-0 flex items-center gap-1">
            ☰ All
          </span>
          {[['All Products','/products'],['Electronics','/products?category=Electronics'],['Clothing','/products?category=Clothing'],['Home','/products?category=Home'],['Sports','/products?category=Sports'],["Today's Deals",'/products?sort=popular'],['Featured','/products?featured=true'],['Flash Sales','/products?flashSale=true']].map(([l,to]) => (
            <Link key={to} to={to} className="shrink-0 text-xs text-gray-200 hover:text-white px-3 py-1 rounded hover:bg-az-light transition-colors whitespace-nowrap">{l}</Link>
          ))}
        </div>
      </nav>
    </>
  );
}
