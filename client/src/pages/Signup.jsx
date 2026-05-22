import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
export default function Signup() {
  const [form, setForm] = useState({ name:'', email:'', password:'', confirm:'' }); const [loading, setLoading] = useState(false);
  const { register } = useAuth(); const navigate = useNavigate();
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password.length < 6) return toast.error('Password must be 6+ characters');
    setLoading(true);
    try { await register(form.name, form.email, form.password); toast.success('Welcome to BEKI Shop! 🎉'); navigate('/'); }
    catch(err) { toast.error(err.response?.data?.message||'Registration failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="min-h-[70vh] bg-az-bg dark:bg-dk-bg flex flex-col items-center justify-center py-10 px-4">
      <Link to="/" className="flex items-center gap-0.5 mb-6"><span className="text-az-dark dark:text-dk-text font-bold text-2xl">Shop</span><span className="text-az-orange font-bold text-2xl">Sphere</span></Link>
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-bold text-az-text dark:text-dk-text mb-5">Create account</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['name','Full Name','text','Your name'],['email','Email','email','you@example.com'],['password','Password','password','Min 6 characters'],['confirm','Re-enter password','password','Confirm password']].map(([k,l,t,ph]) => (
            <div key={k}><label className="label">{l}</label><input type={t} required value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className="input" placeholder={ph}/></div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Creating...':'Create account'}</button>
        </form>
        <p className="text-center text-sm text-az-muted dark:text-dk-muted mt-4">Already have an account? <Link to="/login" className="link font-medium">Sign in</Link></p>
      </div>
    </div>
  );
}
