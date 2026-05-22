import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
const SC = { pending:'badge-yellow', processing:'badge-blue', shipped:'badge-blue', delivered:'badge-green', cancelled:'badge-red', refunded:'badge-gray' };
const STATUSES = ['pending','processing','shipped','delivered','cancelled','refunded'];
export default function AdminOrders() {
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true); const [filter, setFilter] = useState(''); const [pmFilter, setPmFilter] = useState(''); const [modal, setModal] = useState(null); const [updating, setUpdating] = useState(false); const [tracking, setTracking] = useState('');
  const fetchOrders = (s='', pm='') => { setLoading(true); api.get('/orders', { params: { status:s, paymentMethod:pm, limit:100 } }).then(({data}) => { setOrders(data.orders||[]); setLoading(false); }); };
  useEffect(() => { fetchOrders(filter, pmFilter); }, [filter, pmFilter]);
  const handleUpdate = async (id, status) => { setUpdating(true); try { const p = {status}; if(tracking) p.trackingNumber = tracking; const {data} = await api.put(`/orders/${id}/status`, p); setOrders(prev => prev.map(o => o.id===id?data:o)); toast.success(`Updated to "${status}"`); setModal(null); setTracking(''); } catch { toast.error('Failed'); } finally { setUpdating(false); } };
  const handleVerifyCOD = async (id) => { setUpdating(true); try { const {data} = await api.put(`/orders/${id}/verify-cod`); setOrders(prev => prev.map(o => o.id===id?data:o)); toast.success('COD payment verified! Email sent to customer.'); setModal(null); } catch(err) { toast.error(err.response?.data?.message||'Failed'); } finally { setUpdating(false); } };
  const handleRefund = async (id) => { if(!window.confirm('Issue refund for this order?')) return; setUpdating(true); try { const {data} = await api.put(`/orders/${id}/refund`, {reason:'Admin issued refund'}); setOrders(prev => prev.map(o => o.id===id?data:o)); toast.success('Refund issued!'); setModal(null); } catch(err) { toast.error(err.response?.data?.message||'Refund failed'); } finally { setUpdating(false); } };
  return (
    <div>
      <div className="mb-6"><h1 className="text-2xl font-bold text-az-text dark:text-dk-text">Orders</h1><p className="text-az-muted dark:text-dk-muted text-sm">{orders.length} orders</p></div>
      <div className="flex flex-wrap gap-2 mb-4">
        {[['','All'],['cod','COD Only'],['stripe','Stripe Only']].map(([v,l]) => <button key={v} onClick={() => setPmFilter(v)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${pmFilter===v?'bg-az-orange text-white border-az-orange':'border-az-border dark:border-dk-border text-az-muted dark:text-dk-muted hover:border-az-orange hover:text-az-orange'}`}>{l}</button>)}
        <span className="text-az-border dark:text-dk-border">|</span>
        {['',...STATUSES].map(s => <button key={s} onClick={() => setFilter(s)} className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${filter===s?'bg-az-orange text-white border-az-orange':'border-az-border dark:border-dk-border text-az-muted dark:text-dk-muted hover:border-az-orange hover:text-az-orange'}`}>{s===''?'All Status':s.charAt(0).toUpperCase()+s.slice(1)}</button>)}
      </div>
      {loading ? <div className="space-y-2">{Array(5).fill(0).map((_,i) => <div key={i} className="skeleton h-14 rounded"/>)}</div> : (
        <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded overflow-x-auto">
          <table className="w-full text-xs min-w-[900px]"><thead><tr className="bg-az-nav text-white">{['Order','Customer','Total','Payment','Verification','Status','Date','Action'].map(h=><th key={h} className="px-4 py-3 text-left font-medium uppercase tracking-wider">{h}</th>)}</tr></thead>
          <tbody className="divide-y divide-az-border dark:divide-dk-border">
            {orders.length===0?<tr><td colSpan={8} className="px-5 py-10 text-center text-az-muted dark:text-dk-muted">No orders</td></tr>:orders.map(o=>(
              <tr key={o.id} className="hover:bg-az-bg dark:hover:bg-dk-nav transition-colors">
                <td className="px-4 py-3 font-mono font-bold text-az-text dark:text-dk-text">#{o.id.slice(-8).toUpperCase()}</td>
                <td className="px-4 py-3"><p className="font-medium text-az-text dark:text-dk-text">{o.User?.name}</p><p className="text-az-muted dark:text-dk-muted text-[10px]">{o.User?.email}</p></td>
                <td className="px-4 py-3 font-bold text-az-text dark:text-dk-text">${Number(o.totalPrice).toFixed(2)}</td>
                <td className="px-4 py-3"><span className={`badge ${o.paymentMethod==='cod'?'badge-yellow':'badge-blue'}`}>{o.paymentMethod.toUpperCase()}</span></td>
                <td className="px-4 py-3">{o.isPaid?<span className="badge badge-green">✓ Verified</span>:o.paymentMethod==='cod'?<span className="badge badge-yellow">⏳ COD Pending</span>:<span className="badge badge-red">✗ Unpaid</span>}</td>
                <td className="px-4 py-3"><span className={`badge ${SC[o.status]||'badge-gray'} capitalize`}>{o.status}</span></td>
                <td className="px-4 py-3 text-az-muted dark:text-dk-muted whitespace-nowrap">{new Date(o.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3"><button onClick={()=>{setModal(o);setTracking(o.trackingNumber||'');}} className="link text-xs font-medium">Manage</button></td>
              </tr>
            ))}
          </tbody></table>
        </div>
      )}
      {modal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4" onClick={() => setModal(null)}>
          <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-6 w-full max-w-md shadow-xl" onClick={e => e.stopPropagation()}>
            <h2 className="font-bold text-az-text dark:text-dk-text mb-1">Manage Order</h2>
            <p className="text-az-muted dark:text-dk-muted text-xs mb-4">#{modal.id.slice(-8).toUpperCase()} · {modal.User?.name} · <strong className={modal.paymentMethod==='cod'?'text-yellow-600 dark:text-yellow-400':'text-blue-600 dark:text-dk-blue'}>{modal.paymentMethod.toUpperCase()}</strong></p>
            {modal.paymentMethod === 'cod' && !modal.isPaid && (
              <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded">
                <p className="text-yellow-800 dark:text-yellow-300 font-bold text-sm mb-2">💵 COD Payment Verification</p>
                <p className="text-yellow-700 dark:text-yellow-400 text-xs mb-3">Only click this after you have physically collected the cash from the delivery. This will mark the order as paid and send a confirmation email to the customer.</p>
                <button onClick={() => handleVerifyCOD(modal.id)} disabled={updating} className="btn-primary w-full text-sm">{updating?'Verifying...':'✓ Verify Cash Received & Mark Paid'}</button>
              </div>
            )}
            {modal.paymentMethod === 'stripe' && modal.isPaid && (
              <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs">
                <p className="text-green-800 dark:text-green-300 font-bold">✓ Payment verified by Stripe</p>
                <p className="text-green-700 dark:text-green-400">Paid: {modal.paidAt?new Date(modal.paidAt).toLocaleString():'—'}</p>
              </div>
            )}
            <div className="mb-4"><label className="label">Update Status</label><div className="grid grid-cols-3 gap-2">{STATUSES.map(s=><button key={s} onClick={()=>handleUpdate(modal.id,s)} disabled={updating||modal.status===s} className={`py-2 rounded text-xs font-medium border capitalize transition-colors ${modal.status===s?'bg-az-orange text-white border-az-orange':'border-az-border dark:border-dk-border text-az-muted dark:text-dk-muted hover:border-az-orange hover:text-az-orange disabled:opacity-40'}`}>{updating?'...':s}</button>)}</div></div>
            <div className="mb-4"><label className="label">Tracking Number <span className="font-normal text-az-muted dark:text-dk-muted">(optional)</span></label><input value={tracking} onChange={e=>setTracking(e.target.value)} className="input text-sm" placeholder="e.g. 1Z999AA10123456784"/></div>
            {tracking && <button onClick={()=>handleUpdate(modal.id,'shipped')} disabled={updating} className="btn-primary w-full text-sm mb-2">Ship with Tracking</button>}
            {modal.isPaid && modal.status !== 'refunded' && <button onClick={()=>handleRefund(modal.id)} disabled={updating} className="btn-danger w-full text-sm mb-2">Issue Refund</button>}
            <button onClick={()=>{setModal(null);setTracking('');}} className="btn-secondary w-full text-sm">Close</button>
          </div>
        </div>
      )}
    </div>
  );
}
