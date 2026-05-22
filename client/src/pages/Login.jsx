import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
export default function Login() {
  const [form, setForm] = useState({ email:'', password:'' }); const [loading, setLoading] = useState(false);
  const { login } = useAuth(); const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try { const user = await login(form.email, form.password); toast.success(`Welcome back, ${user.name.split(' ')[0]}!`); navigate(user.isAdmin?'/admin':'/'); }
    catch(err) { toast.error(err.response?.data?.message||'Login failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-[70vh] bg-az-bg dark:bg-dk-bg flex flex-col items-center justify-center py-10 px-4">
      <Link to="/" className="flex items-center gap-0.5 mb-6"><span className="text-az-dark dark:text-dk-text font-bold text-2xl">Shop</span><span className="text-az-orange font-bold text-2xl">Sphere</span></Link>
      <div className="w-full max-w-sm">
        <div className="card p-6">
          <h1 className="text-xl font-bold text-az-text dark:text-dk-text mb-5">Sign in</h1>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div><label className="label">Email</label><input type="email" required value={form.email} onChange={e => setForm(f=>({...f,email:e.target.value}))} className="input" placeholder="you@example.com" autoFocus/></div>
            <div><div className="flex justify-between mb-1"><label className="label mb-0">Password</label><Link to="/forgot-password" className="link text-xs">Forgot?</Link></div><input type="password" required value={form.password} onChange={e => setForm(f=>({...f,password:e.target.value}))} className="input" placeholder="••••••••"/></div>
            <button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Signing in...':'Sign In'}</button>
          </form>
          <p className="text-xs text-az-muted dark:text-dk-muted text-center mt-4 border-t border-az-border dark:border-dk-border pt-3">Demo admin: <strong>admin@bekishop.com</strong> / <strong>admin123</strong></p>
        </div>
        <p className="text-center text-sm text-az-muted dark:text-dk-muted mt-4">New? <Link to="/signup" className="link font-medium">Create account</Link></p>
      </div>
    </div>
  );
}
