import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';
export default function ResetPassword() {
  const { token } = useParams(); const [form, setForm] = useState({ password:'', confirm:'' }); const [loading, setLoading] = useState(false); const navigate = useNavigate();
  const handleSubmit = async (e) => { e.preventDefault(); if(form.password!==form.confirm) return toast.error('Passwords do not match'); setLoading(true); try { await api.post(`/auth/reset-password/${token}`, { password:form.password }); toast.success('Password reset!'); navigate('/login'); } catch(err) { toast.error(err.response?.data?.message||'Link expired'); } finally { setLoading(false); } };
  return (
    <div className="min-h-[60vh] bg-az-bg dark:bg-dk-bg flex flex-col items-center justify-center py-10 px-4">
      <div className="w-full max-w-sm card p-6">
        <h1 className="text-xl font-bold text-az-text dark:text-dk-text mb-2">New Password</h1>
        <p className="text-az-muted dark:text-dk-muted text-sm mb-5">Must be at least 6 characters.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['password','New Password'],['confirm','Confirm Password']].map(([k,l]) => (
            <div key={k}><label className="label">{l}</label><input type="password" required value={form[k]} onChange={e=>setForm(f=>({...f,[k]:e.target.value}))} className="input" placeholder="••••••••"/></div>
          ))}
          <button type="submit" disabled={loading} className="btn-primary w-full">{loading?'Resetting...':'Save Password'}</button>
        </form>
      </div>
    </div>
  );
}
