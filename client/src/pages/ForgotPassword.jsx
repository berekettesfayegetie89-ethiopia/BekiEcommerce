import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
export default function ForgotPassword() {
  const [email, setEmail] = useState(''); const [loading, setLoading] = useState(false); const [sent, setSent] = useState(false);
  const handleSubmit = async (e) => { e.preventDefault(); setLoading(true); try { await api.post('/auth/forgot-password', { email }); setSent(true); } catch(err) { toast.error(err.response?.data?.message||'Error'); } finally { setLoading(false); } };
  return (
    <div className="min-h-[60vh] bg-az-bg dark:bg-dk-bg flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-sm card p-6">
        {sent ? <div className="text-center"><div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-4"><svg className="w-7 h-7 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7"/></svg></div><h2 className="font-bold text-az-text dark:text-dk-text text-lg mb-2">Check your inbox</h2><p className="text-az-muted dark:text-dk-muted text-sm mb-4">If that email exists, a reset link was sent.</p><Link to="/login" className="btn-primary text-sm">Back to Sign In</Link></div>
        : <><h1 className="text-xl font-bold text-az-text dark:text-dk-text mb-2">Password assistance</h1><p className="text-az-muted dark:text-dk-muted text-sm mb-5">Enter your email to receive a reset link.</p><form onSubmit={handleSubmit} className="space-y-4"><div><label className="label">Email</label><input type="email" required value={email} onChange={e=>setEmail(e.target.value)} className="input" autoFocus/></div><button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Sending...':'Continue'}</button></form><div className="mt-4 text-center"><Link to="/login" className="link text-sm">← Back to Sign In</Link></div></>}
      </div>
    </div>
  );
}
