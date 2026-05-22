import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
const NAV = [
  { to:'/admin', label:'Dashboard', icon:'▦', end:true },
  { to:'/admin/products', label:'Products', icon:'📦' },
  { to:'/admin/orders', label:'Orders', icon:'🧾' },
  { to:'/admin/users', label:'Users', icon:'👥' },
  { to:'/admin/carts', label:'Active Carts', icon:'🛒' },
  { to:'/admin/coupons', label:'Coupons', icon:'🎫' },
];
export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const handleLogout = () => { logout(); toast.success('Logged out'); navigate('/'); };
  return (
    <div className="flex min-h-[calc(100vh-89px)] bg-az-bg dark:bg-dk-bg">
      <aside className="w-56 bg-az-nav flex flex-col shrink-0">
        <div className="px-4 py-5 border-b border-az-light">
          <p className="text-gray-400 text-xs uppercase tracking-wider mb-1">Admin Panel</p>
          <p className="font-bold text-az-yellow truncate">{user?.name}</p>
          <p className="text-xs text-gray-400 truncate">{user?.email}</p>
        </div>
        <nav className="flex-1 py-3 px-2 space-y-0.5">
          {NAV.map(({ to, label, icon, end }) => (
            <NavLink key={to} to={to} end={end}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors ${isActive ? 'bg-az-orange text-white' : 'text-gray-300 hover:bg-az-light hover:text-white'}`}>
              <span>{icon}</span>{label}
            </NavLink>
          ))}
        </nav>
        <div className="p-3 border-t border-az-light space-y-1">
          <NavLink to="/" className="flex items-center gap-2 px-3 py-2 rounded text-xs text-gray-400 hover:bg-az-light hover:text-white transition-colors">← Back to Store</NavLink>
          <button onClick={handleLogout} className="w-full flex items-center gap-2 px-3 py-2 rounded text-xs text-gray-400 hover:bg-red-900/50 hover:text-white transition-colors">Sign Out</button>
        </div>
      </aside>
      <main className="flex-1 p-6 overflow-auto"><Outlet /></main>
    </div>
  );
}
