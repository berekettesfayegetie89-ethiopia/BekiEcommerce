import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
const MONTHS = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
function Bar({ data }) {
  if (!data?.length) return <p className="text-az-muted text-sm text-center py-8">No revenue data yet</p>;
  const max = Math.max(...data.map(d => Number(d.revenue)||0));
  return (
    <div className="flex items-end gap-1.5 h-36">
      {data.map((d,i) => {
        const h = max > 0 ? Math.max(4, Math.round((Number(d.revenue)/max)*100)) : 4;
        const mo = new Date(d.month);
        return (
          <div key={i} className="flex-1 flex flex-col items-center gap-1 group relative">
            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-az-dark text-white text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 whitespace-nowrap z-10 pointer-events-none">
              ${Number(d.revenue).toFixed(0)} · {d.orders} orders
            </div>
            <div className="w-full bg-az-orange hover:bg-az-hover rounded-t transition-all" style={{height:`${h}%`}}/>
            <span className="text-[9px] text-az-muted">{MONTHS[mo.getMonth()]}</span>
          </div>
        );
      })}
    </div>
  );
}
function Stat({ label, value, sub, icon, color }) {
  return (
    <div className={`bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-5 border-l-4 ${color}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-az-muted dark:text-dk-muted text-xs font-medium uppercase tracking-wider">{label}</p>
        <span className="text-2xl">{icon}</span>
      </div>
      <p className="text-3xl font-bold text-az-text dark:text-dk-text">{value}</p>
      {sub && <p className="text-az-muted dark:text-dk-muted text-xs mt-1">{sub}</p>}
    </div>
  );
}
export default function Dashboard() {
  const [stats, setStats] = useState(null); const [loading, setLoading] = useState(true);
  useEffect(() => { api.get('/admin/stats').then(({data}) => { setStats(data); setLoading(false); }).catch(() => setLoading(false)); }, []);
  const gs = (s) => stats?.statusCounts?.find(x => x.status===s||x._id===s)?.count||0;
  if (loading) return <div className="space-y-4"><div className="grid grid-cols-2 lg:grid-cols-4 gap-4">{Array(4).fill(0).map((_,i) => <div key={i} className="skeleton h-28 rounded"/>)}</div></div>;
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-2xl font-bold text-az-text dark:text-dk-text">Dashboard</h1><p className="text-az-muted dark:text-dk-muted text-sm">BEKI Shop overview</p></div>
      </div>
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Revenue" value={`$${Number(stats?.revenue||0).toLocaleString('en-US',{maximumFractionDigits:0})}`} sub="From paid orders" icon="💰" color="border-green-500"/>
        <Stat label="Orders" value={stats?.totalOrders||0} sub={`${gs('pending')} pending · ${stats?.pendingCOD||0} COD`} icon="🧾" color="border-blue-500"/>
        <Stat label="Customers" value={stats?.totalUsers||0} sub="Registered accounts" icon="👥" color="border-purple-500"/>
        <Stat label="Products" value={stats?.totalProducts||0} sub={`$${Number(stats?.inventoryValue||0).toLocaleString('en-US',{maximumFractionDigits:0})} inv.`} icon="📦" color="border-az-orange"/>
      </div>
      <div className="grid lg:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-5 lg:col-span-2">
          <h2 className="font-bold text-az-text dark:text-dk-text text-sm mb-4">Monthly Revenue</h2>
          <Bar data={stats?.monthlyRevenue}/>
        </div>
        <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-5">
          <h2 className="font-bold text-az-text dark:text-dk-text text-sm mb-4">Orders by Status</h2>
          <div className="space-y-3">
            {[['pending','Pending','bg-yellow-400'],['processing','Processing','bg-blue-400'],['shipped','Shipped','bg-purple-400'],['delivered','Delivered','bg-green-400'],['cancelled','Cancelled','bg-red-400']].map(([k,l,c]) => {
              const count = gs(k); const pct = stats?.totalOrders > 0 ? Math.round((count/stats.totalOrders)*100) : 0;
              return (<div key={k}><div className="flex justify-between text-xs mb-1"><span className="font-medium text-az-text dark:text-dk-text">{l}</span><span className="text-az-muted dark:text-dk-muted">{count} ({pct}%)</span></div><div className="h-2 bg-az-bg dark:bg-dk-border rounded-full overflow-hidden"><div className={`h-full ${c} rounded-full`} style={{width:`${pct}%`}}/></div></div>);
            })}
          </div>
          {(stats?.pendingCOD||0) > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs">
              <p className="font-bold text-yellow-800 dark:text-yellow-300">⚠️ {stats.pendingCOD} COD orders need verification</p>
              <Link to="/admin/orders?paymentMethod=cod&isPaid=false" className="text-yellow-700 dark:text-yellow-400 hover:underline">View COD orders →</Link>
            </div>
          )}
        </div>
      </div>
      <div className="grid lg:grid-cols-2 gap-4">
        <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-5">
          <div className="flex items-center justify-between mb-4"><h2 className="font-bold text-az-text dark:text-dk-text text-sm">Top Products</h2><Link to="/admin/products" className="link text-xs">Manage →</Link></div>
          {!stats?.topProducts?.length ? <p className="text-az-muted dark:text-dk-muted text-sm">No sales yet</p> : (
            <div className="space-y-2">{stats.topProducts.map((p,i) => (
              <div key={i} className="flex items-center gap-3 p-2 rounded hover:bg-az-bg dark:hover:bg-dk-border transition-colors">
                <span className="text-az-muted font-bold text-sm w-4 shrink-0">{i+1}</span>
                <img src={p.productImage} alt="" className="w-10 h-10 object-contain bg-white dark:bg-dk-nav border border-az-border dark:border-dk-border rounded p-0.5 shrink-0"/>
                <div className="flex-1 min-w-0"><p className="text-xs font-medium text-az-text dark:text-dk-text line-clamp-1">{p.productName}</p><p className="text-xs text-az-muted dark:text-dk-muted">{p.totalSold} sold · ${Number(p.revenue).toFixed(2)}</p></div>
              </div>
            ))}</div>
          )}
        </div>
        <div className="bg-white dark:bg-dk-card border border-az-border dark:border-dk-border rounded p-5">
          <h2 className="font-bold text-az-text dark:text-dk-text text-sm mb-4">Quick Actions</h2>
          <div className="grid grid-cols-2 gap-3">
            {[['+ Product','/admin/products/new','bg-az-orange text-white'],['All Orders','/admin/orders','bg-blue-500 text-white'],['COD Orders','/admin/orders?paymentMethod=cod','bg-yellow-500 text-white'],['Coupons','/admin/coupons','bg-green-500 text-white']].map(([l,to,cls]) => (
              <Link key={to} to={to} className={`${cls} rounded p-4 flex items-center justify-center font-bold text-sm hover:opacity-90 transition-opacity`}>{l}</Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
