import { useEffect, useState } from 'react';
import api from '../../api/axios';
export default function AdminCarts() {
  const [carts, setCarts] = useState([]); const [loading, setLoading] = useState(true); const [expanded, setExpanded] = useState(null);
  useEffect(() => { api.get('/admin/carts').then(({data}) => { setCarts(data); setLoading(false); }); }, []);
  const total = (c) => (c.items||[]).reduce((s,i) => s+Number(i.product?.price||0)*i.quantity, 0);
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-az-text dark:text-dk-text">Active Carts</h1><p className="text-az-muted dark:text-dk-muted text-sm">{carts.length} carts with items</p></div>
      {loading?<div className="space-y-2">{Array(4).fill(0).map((_,i)=><div key={i} className="skeleton h-16 rounded"/>)}</div>:carts.length===0?<div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-16 text-center"><p className="text-az-muted dark:text-dk-muted">No active carts.</p></div>:(
        <div className="space-y-2">{carts.map(cart=>(
          <div key={cart.id} className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded overflow-hidden">
            <button onClick={()=>setExpanded(expanded===cart.id?null:cart.id)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-az-bg dark:hover:bg-dk-nav transition-colors text-left">
              <div className="flex items-center gap-4"><div className="w-9 h-9 rounded-full bg-az-nav text-white text-sm flex items-center justify-center font-bold shrink-0">{cart.User?.name?.[0]?.toUpperCase()||'?'}</div><div><p className="font-medium text-az-text dark:text-dk-text text-sm">{cart.User?.name}</p><p className="text-az-muted dark:text-dk-muted text-xs">{cart.User?.email}</p></div></div>
              <div className="flex items-center gap-6"><div className="text-right"><p className="text-xs text-az-muted dark:text-dk-muted">Cart Value</p><p className="font-bold price">${total(cart).toFixed(2)}</p></div><span className="text-az-muted dark:text-dk-muted text-xs">{expanded===cart.id?'▲':'▼'}</span></div>
            </button>
            {expanded===cart.id&&<div className="border-t border-az-border dark:border-dk-border"><table className="w-full text-xs"><thead><tr className="bg-az-bg dark:bg-dk-nav">{['Product','Qty','Price','Subtotal'].map(h=><th key={h} className="px-4 py-2 text-left text-az-muted dark:text-dk-muted font-medium">{h}</th>)}</tr></thead><tbody className="divide-y divide-az-border dark:divide-dk-border">{(cart.items||[]).map(i=><tr key={i.id} className="hover:bg-az-bg dark:hover:bg-dk-nav/50"><td className="px-4 py-3"><div className="flex items-center gap-3"><img src={i.product?.image} alt="" className="w-10 h-10 object-contain bg-white dark:bg-dk-nav border border-az-border dark:border-dk-border rounded p-0.5 shrink-0"/><span className="font-medium text-az-text dark:text-dk-text line-clamp-1 max-w-[160px]">{i.product?.name}</span></div></td><td className="px-4 py-3 text-az-muted dark:text-dk-muted">×{i.quantity}</td><td className="px-4 py-3 text-az-muted dark:text-dk-muted">${Number(i.product?.price||0).toFixed(2)}</td><td className="px-4 py-3 font-bold text-az-text dark:text-dk-text">${(Number(i.product?.price||0)*i.quantity).toFixed(2)}</td></tr>)}</tbody><tfoot><tr className="bg-az-bg dark:bg-dk-nav border-t-2 border-az-border dark:border-dk-border"><td colSpan={3} className="px-4 py-3 text-right font-bold text-az-text dark:text-dk-text">Total:</td><td className="px-4 py-3 font-bold price">${total(cart).toFixed(2)}</td></tr></tfoot></table></div>}
          </div>
        ))}
        </div>
      )}
    </div>
  );
}
