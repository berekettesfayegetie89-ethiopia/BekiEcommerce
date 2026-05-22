import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import { OrderSkeleton } from '../components/Skeletons';
const SC = { pending:'badge-yellow', processing:'badge-blue', shipped:'badge-blue', delivered:'badge-green', cancelled:'badge-red', refunded:'badge-gray' };
export default function Orders() {
  const [orders, setOrders] = useState([]); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/orders/my').then(({data}) => { setOrders(data); setLoading(false); }); }, []);
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-az-text dark:text-dk-text mb-6">Your Orders</h1>
      {loading ? <div className="space-y-3">{Array(3).fill(0).map((_,i) => <OrderSkeleton key={i}/>)}</div>
      : orders.length === 0 ? <div className="card p-16 text-center"><p className="text-4xl mb-4">📦</p><h2 className="font-bold text-az-text dark:text-dk-text mb-2">No orders yet</h2><Link to="/products" className="btn-primary text-sm mt-2 inline-block">Start Shopping</Link></div>
      : <div className="space-y-4">{orders.map(o => (
        <div key={o.id} className="card overflow-hidden">
          <div className="bg-az-bg dark:bg-dk-nav px-5 py-3 flex flex-wrap items-center justify-between gap-3 border-b border-az-border dark:border-dk-border text-xs text-az-muted dark:text-dk-muted">
            <div className="flex gap-6">
              {[['Order Placed', new Date(o.createdAt).toLocaleDateString()],['Total',`$${Number(o.totalPrice).toFixed(2)}`],['Payment',o.paymentMethod.toUpperCase()]].map(([l,v]) => (
                <div key={l}><p className="uppercase font-bold mb-0.5 tracking-wider">{l}</p><p className="text-az-text dark:text-dk-text font-medium">{v}</p></div>
              ))}
            </div>
            <div className="text-right"><p className="uppercase font-bold mb-0.5 tracking-wider">Order ID</p><p className="font-mono text-az-text dark:text-dk-text">#{o.id.slice(-8).toUpperCase()}</p></div>
          </div>
          <div className="px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className={`badge ${SC[o.status]||'badge-gray'} capitalize`}>{o.status}</span>
                {o.isPaid ? <span className="badge badge-green">✓ Paid</span> : o.paymentMethod === 'cod' ? <span className="badge badge-yellow">COD Pending</span> : <span className="badge badge-red">Unpaid</span>}
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {(o.items||[]).slice(0,4).map(i => <img key={i.id} src={i.productImage} alt="" className="w-11 h-11 object-contain border border-az-border dark:border-dk-border rounded p-0.5 bg-white dark:bg-dk-nav"/>)}
                {(o.items?.length||0) > 4 && <span className="text-az-muted dark:text-dk-muted text-xs">+{o.items.length-4} more</span>}
              </div>
            </div>
            <Link to={`/orders/${o.id}`} className="btn-secondary text-sm shrink-0">View Details</Link>
          </div>
        </div>
      ))}</div>}
    </div>
  );
}
