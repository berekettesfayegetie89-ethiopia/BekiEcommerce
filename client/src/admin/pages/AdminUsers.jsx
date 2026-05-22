import { useEffect, useState } from 'react';
import api from '../../api/axios';
import { useAuth } from '../../context/AuthContext';
import toast from 'react-hot-toast';
export default function AdminUsers() {
  const [users, setUsers] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [modal, setModal] = useState(null); const [saving, setSaving] = useState(false); const { user: me } = useAuth();
  useEffect(() => { api.get('/users?limit=100').then(({data}) => { setUsers(data.users||[]); setLoading(false); }); }, []);
  const handleDelete = async (id, name) => { if(id===me.id) return toast.error("Can't delete yourself"); if(!window.confirm(`Delete "${name}"?`)) return; try { await api.delete(`/users/${id}`); toast.success('Deleted'); setUsers(u => u.filter(x => x.id!==id)); } catch(err) { toast.error(err.response?.data?.message||'Failed'); } };
  const handleSave = async (e) => { e.preventDefault(); setSaving(true); try { const {data} = await api.put(`/users/${modal.id}`, {name:modal.name, email:modal.email, isAdmin:modal.isAdmin}); setUsers(u => u.map(x => x.id===data.id?data:x)); toast.success('Updated!'); setModal(null); } catch(err) { toast.error(err.response?.data?.message||'Failed'); } finally { setSaving(false); } };
  const filtered = users.filter(u => u.name.toLowerCase().includes(search.toLowerCase())||u.email.toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-az-text dark:text-dk-text">Users</h1><p className="text-az-muted dark:text-dk-muted text-sm">{users.length} accounts</p></div>
      <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-4 mb-4"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search users..." className="input max-w-md"/></div>
      {loading ? <div className="space-y-2">{Array(5).fill(0).map((_,i) => <div key={i} className="skeleton h-14 rounded"/>)}</div> : (
        <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="bg-az-nav text-white text-xs">{['User','Email','Role','Joined','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-az-border dark:divide-dk-border">
            {filtered.length===0?<tr><td colSpan={5} className="px-5 py-10 text-center text-az-muted dark:text-dk-muted">No users</td></tr>:filtered.map(u=>(
              <tr key={u.id} className="hover:bg-az-bg dark:hover:bg-dk-nav transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><div className="w-8 h-8 rounded-full bg-az-nav text-white text-xs flex items-center justify-center font-bold shrink-0">{u.name?.[0]?.toUpperCase()}</div><span className="font-medium text-az-text dark:text-dk-text text-xs">{u.name}{u.id===me.id&&<span className="text-az-muted dark:text-dk-muted ml-1">(you)</span>}</span></div></td>
                <td className="px-4 py-3 text-az-muted dark:text-dk-muted text-xs">{u.email}</td>
                <td className="px-4 py-3"><span className={`badge text-xs ${u.isAdmin?'badge-orange':'badge-gray'}`}>{u.isAdmin?'Admin':'Customer'}</span></td>
                <td className="px-4 py-3 text-az-muted dark:text-dk-muted text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><div className="flex gap-3"><button onClick={()=>setModal({...u})} className="link text-xs font-medium">Edit</button>{u.id!==me.id&&<button onClick={()=>handleDelete(u.id,u.name)} className="text-az-red dark:text-dk-red text-xs hover:underline font-medium">Delete</button>}</div></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
      {modal&&<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={()=>setModal(null)}><div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-6 w-full max-w-sm shadow-xl" onClick={e=>e.stopPropagation()}><h2 className="font-bold text-az-text dark:text-dk-text mb-5">Edit User</h2><form onSubmit={handleSave} className="space-y-4">{[['name','Full Name','text'],['email','Email','email']].map(([k,l,t])=><div key={k}><label className="label">{l}</label><input type={t} required value={modal[k]} onChange={e=>setModal(m=>({...m,[k]:e.target.value}))} className="input"/></div>)}<label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={modal.isAdmin} onChange={e=>setModal(m=>({...m,isAdmin:e.target.checked}))} className="w-4 h-4 accent-orange-500"/><div><span className="text-sm font-medium text-az-text dark:text-dk-text">Admin privileges</span></div></label><div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving?'Saving...':'Save'}</button><button type="button" onClick={()=>setModal(null)} className="btn-secondary px-4 text-sm">Cancel</button></div></form></div></div>}
    </div>
  );
}
