import { useEffect, useState } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
const EMPTY = { code:'', type:'percentage', value:'', minOrderAmount:'0', maxUsage:'100', expiresAt:'', isActive:true };
export default function AdminCoupons() {
  const [coupons, setCoupons] = useState([]); const [loading, setLoading] = useState(true); const [modal, setModal] = useState(null); const [saving, setSaving] = useState(false);
  useEffect(() => { api.get('/coupons').then(({data}) => { setCoupons(data); setLoading(false); }); }, []);
  const handleSave = async (e) => { e.preventDefault(); setSaving(true); try { if(modal.id) { const {data} = await api.put(`/coupons/${modal.id}`, modal); setCoupons(c => c.map(x => x.id===data.id?data:x)); toast.success('Updated!'); } else { const {data} = await api.post('/coupons', modal); setCoupons(c => [data,...c]); toast.success('Coupon created!'); } setModal(null); } catch(err) { toast.error(err.response?.data?.message||'Failed'); } finally { setSaving(false); } };
  const handleDelete = async (id, code) => { if(!window.confirm(`Delete coupon "${code}"?`)) return; try { await api.delete(`/coupons/${id}`); toast.success('Deleted'); setCoupons(c => c.filter(x => x.id!==id)); } catch { toast.error('Failed'); } };
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold text-az-text dark:text-dk-text">Coupons</h1><p className="text-az-muted dark:text-dk-muted text-sm">{coupons.length} coupon codes</p></div><button onClick={()=>setModal({...EMPTY})} className="btn-primary text-sm">+ New Coupon</button></div>
      {loading?<div className="space-y-2">{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton h-14 rounded"/>)}</div>:(
        <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="bg-az-nav text-white text-xs">{['Code','Type','Value','Min Order','Usage','Expires','Status','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-az-border dark:divide-dk-border">
            {coupons.length===0?<tr><td colSpan={8} className="px-5 py-10 text-center text-az-muted dark:text-dk-muted">No coupons yet</td></tr>:coupons.map(c=>(
              <tr key={c.id} className="hover:bg-az-bg dark:hover:bg-dk-nav transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-az-text dark:text-dk-text">{c.code}</td>
                <td className="px-4 py-3 text-az-muted dark:text-dk-muted text-xs capitalize">{c.type}</td>
                <td className="px-4 py-3 font-bold text-az-text dark:text-dk-text">{c.type==='percentage'?`${c.value}%`:`$${Number(c.value).toFixed(2)}`}</td>
                <td className="px-4 py-3 text-az-muted dark:text-dk-muted text-xs">${Number(c.minOrderAmount).toFixed(0)}</td>
                <td className="px-4 py-3 text-xs"><span className="text-az-text dark:text-dk-text font-medium">{c.usedCount}</span><span className="text-az-muted dark:text-dk-muted">/{c.maxUsage}</span></td>
                <td className="px-4 py-3 text-az-muted dark:text-dk-muted text-xs">{c.expiresAt?new Date(c.expiresAt).toLocaleDateString():'Never'}</td>
                <td className="px-4 py-3"><span className={`badge text-xs ${c.isActive&&(!c.expiresAt||new Date(c.expiresAt)>new Date())?'badge-green':'badge-red'}`}>{c.isActive&&(!c.expiresAt||new Date(c.expiresAt)>new Date())?'Active':'Inactive'}</span></td>
                <td className="px-4 py-3"><div className="flex gap-3"><button onClick={()=>setModal({...c,expiresAt:c.expiresAt?c.expiresAt.slice(0,10):''})} className="link text-xs font-medium">Edit</button><button onClick={()=>handleDelete(c.id,c.code)} className="text-az-red dark:text-dk-red text-xs hover:underline font-medium">Delete</button></div></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
      {modal&&<div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={()=>setModal(null)}><div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-6 w-full max-w-md shadow-xl" onClick={e=>e.stopPropagation()}><h2 className="font-bold text-az-text dark:text-dk-text mb-5">{modal.id?'Edit':'New'} Coupon</h2><form onSubmit={handleSave} className="space-y-4"><div><label className="label">Code</label><input required value={modal.code} onChange={e=>setModal(m=>({...m,code:e.target.value.toUpperCase()}))} className="input font-mono" placeholder="SUMMER20"/></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Type</label><select value={modal.type} onChange={e=>setModal(m=>({...m,type:e.target.value}))} className="input"><option value="percentage">Percentage %</option><option value="fixed">Fixed $</option></select></div><div><label className="label">Value</label><input type="number" required min="0" step="0.01" value={modal.value} onChange={e=>setModal(m=>({...m,value:e.target.value}))} className="input" placeholder={modal.type==='percentage'?'10':'15'}/></div></div><div className="grid grid-cols-2 gap-4"><div><label className="label">Min Order ($)</label><input type="number" min="0" value={modal.minOrderAmount} onChange={e=>setModal(m=>({...m,minOrderAmount:e.target.value}))} className="input"/></div><div><label className="label">Max Uses</label><input type="number" min="1" value={modal.maxUsage} onChange={e=>setModal(m=>({...m,maxUsage:e.target.value}))} className="input"/></div></div><div><label className="label">Expires (optional)</label><input type="date" value={modal.expiresAt||''} onChange={e=>setModal(m=>({...m,expiresAt:e.target.value}))} className="input"/></div><label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={modal.isActive} onChange={e=>setModal(m=>({...m,isActive:e.target.checked}))} className="w-4 h-4 accent-orange-500"/><span className="text-sm font-medium text-az-text dark:text-dk-text">Active</span></label><div className="flex gap-3"><button type="submit" disabled={saving} className="btn-primary flex-1 text-sm">{saving?'Saving...':'Save Coupon'}</button><button type="button" onClick={()=>setModal(null)} className="btn-secondary px-4 text-sm">Cancel</button></div></form></div></div>}
    </div>
  );
}
