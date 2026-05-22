import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../api/axios';
const TL = ['pending','processing','shipped','delivered'];
const SC = { pending:'badge-yellow', processing:'badge-blue', shipped:'badge-blue', delivered:'badge-green', cancelled:'badge-red', refunded:'badge-gray' };
export default function OrderDetail() {
  const { id } = useParams(); const [order, setOrder] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get(`/orders/${id}`).then(({data}) => { setOrder(data); setLoading(false); }).catch(() => setLoading(false)); }, [id]);
  if (loading) return <div className="max-w-4xl mx-auto px-4 py-8 space-y-3">{Array(5).fill(0).map((_,i) => <div key={i} className="skeleton h-14 rounded"/>)}</div>;
  if (!order) return <div className="max-w-4xl mx-auto px-4 py-16 text-center"><p className="text-az-muted dark:text-dk-muted">Order not found.</p><Link to="/orders" className="btn-primary text-sm mt-4 inline-block">Back to Orders</Link></div>;
  const si = TL.indexOf(order.status);
  return (
    <div className="max-w-4xl mx-auto px-4 py-6">
      <div className="flex items-center justify-between mb-6"><div><h1 className="text-xl font-bold text-az-text dark:text-dk-text">Order Details</h1><p className="text-az-muted dark:text-dk-muted text-xs mt-0.5">#{order.id.toUpperCase()} · {new Date(order.createdAt).toLocaleDateString()}</p></div><Link to="/orders" className="link text-sm">← Back</Link></div>
      {!['cancelled','refunded'].includes(order.status) && (
        <div className="card p-5 mb-4"><div className="flex items-center">{TL.map((s,i) => (<div key={s} className="flex items-center flex-1"><div className="flex flex-col items-center"><div className={`w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${i<=si?'bg-az-orange border-az-orange text-white':'border-az-border dark:border-dk-border text-az-muted dark:text-dk-muted'}`}>{i<si?'✓':i+1}</div><span className={`text-xs mt-1 capitalize hidden sm:block font-medium ${i<=si?'text-az-orange':'text-az-muted dark:text-dk-muted'}`}>{s}</span></div>{i<TL.length-1&&<div className={`flex-1 h-1 mx-2 rounded ${i<si?'bg-az-orange':'bg-az-border dark:bg-dk-border'}`}/>}</div>))}</div></div>
      )}
      <div className="grid md:grid-cols-2 gap-4 mb-4">
        <div className="card p-4"><h3 className="font-bold text-sm text-az-text dark:text-dk-text mb-3 pb-2 border-b border-az-border dark:border-dk-border">Shipping Address</h3>
          <p className="text-sm font-medium text-az-text dark:text-dk-text">{order.shippingFullName}</p>
          <p className="text-sm text-az-muted dark:text-dk-muted">{order.shippingAddress}</p>
          <p className="text-sm text-az-muted dark:text-dk-muted">{order.shippingCity}, {order.shippingPostalCode}</p>
          <p className="text-sm text-az-muted dark:text-dk-muted">{order.shippingCountry} · 📞 {order.shippingPhone}</p>
        </div>
        <div className="card p-4"><h3 className="font-bold text-sm text-az-text dark:text-dk-text mb-3 pb-2 border-b border-az-border dark:border-dk-border">Payment Info</h3>
          <div className="flex items-center gap-2 mb-2"><span className={`badge ${SC[order.status]||'badge-gray'} capitalize`}>{order.status}</span>{order.isPaid?<span className="badge badge-green">✓ Paid</span>:<span className="badge badge-yellow">{order.paymentMethod==='cod'?'COD Pending':'Unpaid'}</span>}</div>
          <p className="text-sm text-az-text dark:text-dk-text">Method: <span className="capitalize font-medium">{order.paymentMethod==='cod'?'Cash on Delivery':'Credit Card (Stripe)'}</span></p>
          {order.isPaid && <p className="text-sm text-az-green dark:text-dk-green">✓ Paid {new Date(order.paidAt).toLocaleDateString()}</p>}
          {order.codVerified && <p className="text-xs text-az-muted dark:text-dk-muted mt-1">Cash verified by: {order.codVerifiedBy}</p>}
          {order.trackingNumber && <p className="text-sm mt-2">Tracking: <span className="font-mono font-bold text-az-link dark:text-dk-blue">{order.trackingNumber}</span></p>}
        </div>
      </div>
      <div className="card p-4">
        <h3 className="font-bold text-sm text-az-text dark:text-dk-text mb-4 pb-2 border-b border-az-border dark:border-dk-border">Order Items</h3>
        <div className="space-y-3 mb-4">
          {order.items?.map(i => (
            <div key={i.id} className="flex items-center gap-4 pb-3 border-b border-az-border dark:border-dk-border last:border-0">
              <img src={i.productImage} alt="" className="w-16 h-16 object-contain border border-az-border dark:border-dk-border rounded p-1 bg-white dark:bg-dk-nav shrink-0"/>
              <div className="flex-1 min-w-0"><p className="text-sm font-medium text-az-text dark:text-dk-text line-clamp-2">{i.productName}</p><p className="text-xs text-az-muted dark:text-dk-muted">Qty: {i.quantity} × ${Number(i.price).toFixed(2)}</p></div>
              <p className="font-bold text-az-text dark:text-dk-text shrink-0">${(Number(i.price)*i.quantity).toFixed(2)}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1 text-sm max-w-xs ml-auto border-t border-az-border dark:border-dk-border pt-3">
          {[['Subtotal',`$${Number(order.itemsPrice).toFixed(2)}`],['Discount',order.discountAmount>0?`-$${Number(order.discountAmount).toFixed(2)}`:'—'],['Shipping',Number(order.shippingPrice)===0?'FREE':`$${Number(order.shippingPrice).toFixed(2)}`],['Tax',`$${Number(order.taxPrice).toFixed(2)}`]].filter(([,v])=>v!=='—').map(([l,v])=>(
            <div key={l} className="flex justify-between"><span className="text-az-muted dark:text-dk-muted">{l}</span><span className={v==='FREE'?'text-az-green dark:text-dk-green font-medium':v.startsWith('-')?'text-az-green dark:text-dk-green font-medium':'text-az-text dark:text-dk-text'}>{v}</span></div>
          ))}
          <div className="flex justify-between font-bold text-base border-t border-az-border dark:border-dk-border pt-2"><span>Total</span><span className="price">${Number(order.totalPrice).toFixed(2)}</span></div>
        </div>
      </div>
    </div>
  );
}
