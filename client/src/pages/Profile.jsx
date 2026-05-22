import { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
export default function Profile() {
  const { user, updateUser } = useAuth();
  const [form, setForm] = useState({ name:user?.name||'', email:user?.email||'', phone:user?.phone||'', password:'', confirm:'' });
  const [loading, setLoading] = useState(false);
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (form.password && form.password !== form.confirm) return toast.error('Passwords do not match');
    if (form.password && form.password.length < 6) return toast.error('Password must be 6+ chars');
    setLoading(true);
    try {
      const payload = { name:form.name, email:form.email, phone:form.phone };
      if (form.password) payload.password = form.password;
      const { data } = await api.put('/auth/profile', payload);
      updateUser(data.user);
      setForm(f => ({...f, password:'', confirm:''}));
      toast.success('Profile updated!');
    } catch(err) { toast.error(err.response?.data?.message||'Failed'); }
    finally { setLoading(false); }
  };
  return (
    <div className="max-w-xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-az-text dark:text-dk-text mb-6">My Account</h1>
      <div className="card p-6 mb-4">
        <div className="flex items-center gap-4 mb-6 pb-6 border-b border-az-border dark:border-dk-border">
          <div className="w-16 h-16 rounded-full bg-az-nav text-white flex items-center justify-center text-2xl font-bold shrink-0">{user?.name?.[0]?.toUpperCase()}</div>
          <div><p className="font-bold text-az-text dark:text-dk-text text-lg">{user?.name}</p><p className="text-az-muted dark:text-dk-muted text-sm">{user?.email}</p>{user?.isAdmin&&<span className="badge badge-orange mt-1 inline-block">Admin</span>}</div>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          {[['name','Full Name','text',true],['email','Email','email',true],['phone','Phone','tel',false]].map(([k,l,t,req]) => (
            <div key={k}><label className="label">{l}</label><input type={t} required={req} value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className="input"/></div>
          ))}
          <div className="border-t border-az-border dark:border-dk-border pt-4">
            <h3 className="font-bold text-az-text dark:text-dk-text text-sm mb-3">Change Password <span className="font-normal text-az-muted dark:text-dk-muted">(optional)</span></h3>
            {[['password','New Password'],['confirm','Confirm Password']].map(([k,l]) => (
              <div key={k} className="mb-3"><label className="label">{l}</label><input type="password" value={form[k]} onChange={e => setForm(f=>({...f,[k]:e.target.value}))} className="input" placeholder="Leave blank to keep current"/></div>
            ))}
          </div>
          <button type="submit" disabled={loading} className="btn-primary">{loading?'Saving...':'Save Changes'}</button>
        </form>
      </div>
      <div className="card p-5"><h3 className="font-bold text-az-text dark:text-dk-text text-sm mb-3">Quick Links</h3><div className="grid grid-cols-3 gap-2">{[['Orders','/orders','📦'],['Wishlist','/wishlist','❤️'],['Shop','/products','🛍️']].map(([l,to,icon]) => <Link key={to} to={to} className="btn-secondary text-sm text-center flex flex-col items-center gap-1 py-3"><span className="text-lg">{icon}</span>{l}</Link>)}</div></div>
    </div>
  );
}
