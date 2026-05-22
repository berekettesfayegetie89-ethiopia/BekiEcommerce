import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
export default function AdminProducts() {
  const [products, setProducts] = useState([]); const [loading, setLoading] = useState(true); const [search, setSearch] = useState(''); const [deleting, setDeleting] = useState(null);
  useEffect(() => { api.get('/products?limit=200').then(({data}) => { setProducts(data.products||[]); setLoading(false); }); }, []);
  const handleDelete = async (id, name) => {
    if (!window.confirm(`Delete "${name}"?`)) return;
    setDeleting(id);
    try { await api.delete(`/products/${id}`); toast.success('Deleted'); setProducts(p => p.filter(x => x.id !== id)); }
    catch { toast.error('Failed'); } finally { setDeleting(null); }
  };
  const filtered = products.filter(p => p.name.toLowerCase().includes(search.toLowerCase())||p.category.toLowerCase().includes(search.toLowerCase())||String(p.brand||'').toLowerCase().includes(search.toLowerCase()));
  return (
    <div>
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-2xl font-bold text-az-text dark:text-dk-text">Products</h1><p className="text-az-muted dark:text-dk-muted text-sm">{products.length} in catalogue</p></div><Link to="/admin/products/new" className="btn-primary text-sm">+ Add Product</Link></div>
      <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-4 mb-4"><input value={search} onChange={e=>setSearch(e.target.value)} placeholder="Search..." className="input max-w-md"/></div>
      {loading ? <div className="space-y-2">{Array(6).fill(0).map((_,i)=><div key={i} className="skeleton h-14 rounded"/>)}</div> : (
        <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded overflow-hidden">
          <table className="w-full text-sm"><thead><tr className="bg-az-nav text-white text-xs">{['Product','Category','Price','Stock','Flash','Actions'].map(h=><th key={h} className="px-4 py-3 text-left font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-az-border dark:divide-dk-border">
            {filtered.length===0?<tr><td colSpan={6} className="px-5 py-10 text-center text-az-muted dark:text-dk-muted">No products found</td></tr>:filtered.map(p=>(
              <tr key={p.id} className="hover:bg-az-bg dark:hover:bg-dk-nav transition-colors">
                <td className="px-4 py-3"><div className="flex items-center gap-3"><img src={p.image} alt="" className="w-10 h-10 object-contain bg-white dark:bg-dk-nav border border-az-border dark:border-dk-border rounded p-0.5 shrink-0"/><span className="font-medium text-az-text dark:text-dk-text text-xs line-clamp-2 max-w-[160px]">{p.name}</span></div></td>
                <td className="px-4 py-3 text-az-muted dark:text-dk-muted text-xs">{p.category}</td>
                <td className="px-4 py-3"><span className="price text-xs font-bold">${Number(p.price).toFixed(2)}</span>{Number(p.originalPrice)>Number(p.price)&&<span className="block text-[10px] text-az-muted dark:text-dk-muted line-through">${Number(p.originalPrice).toFixed(2)}</span>}</td>
                <td className="px-4 py-3"><span className={`badge text-xs ${p.stock===0?'badge-red':p.stock<=5?'badge-yellow':'badge-green'}`}>{p.stock}</span></td>
                <td className="px-4 py-3">{p.isFlashSale&&new Date(p.flashSaleEnds)>new Date()?<span className="badge badge-red text-xs">⚡ Active</span>:<span className="text-az-muted dark:text-dk-muted text-xs">—</span>}</td>
                <td className="px-4 py-3"><div className="flex gap-3"><Link to={`/admin/products/${p.id}/edit`} className="link text-xs font-medium">Edit</Link><button onClick={()=>handleDelete(p.id,p.name)} disabled={deleting===p.id} className="text-az-red dark:text-dk-red text-xs hover:underline font-medium disabled:opacity-50">{deleting===p.id?'...':'Delete'}</button></div></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
    </div>
  );
}
