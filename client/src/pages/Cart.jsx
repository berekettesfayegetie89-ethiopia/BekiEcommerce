import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';
export default function Cart() {
  const { cart, cartLoading, cartTotal, updateQuantity, removeItem } = useCart();
  const navigate = useNavigate();
  const shipping = cartTotal>=100?0:cartTotal>0?9.99:0;
  const tax = parseFloat((cartTotal*0.08).toFixed(2));
  const total = parseFloat((cartTotal+shipping+tax).toFixed(2));
  if(cartLoading) return <div className="max-w-5xl mx-auto px-4 py-8 space-y-3">{Array(3).fill(0).map((_,i)=><div key={i} className="skeleton h-24 rounded"/>)}</div>;
  return (
    <div className="max-w-5xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-display font-bold text-az-text dark:text-dk-text mb-6">Shopping Cart</h1>
      {!(cart.items?.length) ? (
        <div className="card p-16 text-center"><p className="text-5xl mb-4">🛒</p><h2 className="font-bold text-az-text dark:text-dk-text text-xl mb-2">Your cart is empty</h2><Link to="/products" className="btn-primary text-sm mt-4 inline-block">Start Shopping</Link></div>
      ) : (
        <div className="grid lg:grid-cols-[1fr_300px] gap-5">
          <div className="card">
            <div className="px-5 py-3 border-b border-az-border dark:border-dk-border flex justify-between items-center">
              <h2 className="font-bold text-az-text dark:text-dk-text">Cart ({cart.items.length} items)</h2>
              <span className="text-az-muted dark:text-dk-muted text-sm">Price</span>
            </div>
            {cart.items.map((item,idx) => (
              <div key={item.id||idx} className={`px-5 py-4 flex gap-4 ${idx<cart.items.length-1?'border-b border-az-border dark:border-dk-border':''}`}>
                <Link to={`/products/${item.product?.id}`}><img src={item.product?.image} alt="" className="w-24 h-24 object-contain bg-white dark:bg-dk-nav rounded border border-az-border dark:border-dk-border p-1 hover:opacity-80 transition-opacity"/></Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/products/${item.product?.id}`}><h3 className="link text-sm font-medium mb-1 line-clamp-2">{item.product?.name}</h3></Link>
                  <p className="text-az-green dark:text-dk-green text-xs font-medium mb-3">{item.product?.stock>0?'In Stock':'Out of Stock'}</p>
                  <div className="flex items-center gap-3 flex-wrap">
                    <div className="flex items-center border border-az-border dark:border-dk-border rounded overflow-hidden bg-az-bg dark:bg-dk-nav">
                      <button onClick={()=>updateQuantity(item.id,item.quantity-1).catch(()=>toast.error('Failed'))} className="px-3 py-1.5 text-az-text dark:text-dk-text hover:bg-az-border dark:hover:bg-dk-border transition-colors text-sm">−</button>
                      <span className="px-4 py-1.5 text-az-text dark:text-dk-text border-x border-az-border dark:border-dk-border text-sm">{item.quantity}</span>
                      <button onClick={()=>updateQuantity(item.id,item.quantity+1).catch(()=>toast.error('Failed'))} className="px-3 py-1.5 text-az-text dark:text-dk-text hover:bg-az-border dark:hover:bg-dk-border transition-colors text-sm">+</button>
                    </div>
                    <button onClick={()=>removeItem(item.id).then(()=>toast.success('Removed')).catch(()=>{})} className="link text-xs">Delete</button>
                  </div>
                </div>
                <div className="shrink-0 font-bold text-az-text dark:text-dk-text">${(Number(item.product?.price||0)*item.quantity).toFixed(2)}</div>
              </div>
            ))}
            <div className="px-5 py-3 text-right border-t border-az-border dark:border-dk-border">
              <span className="text-az-text dark:text-dk-text">Subtotal ({cart.items.reduce((s,i)=>s+i.quantity,0)} items): <span className="font-bold text-lg">${cartTotal.toFixed(2)}</span></span>
            </div>
          </div>
          <div className="space-y-3">
            <div className="card p-4">
              {cartTotal>=100&&<div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded p-2 mb-3 text-xs text-green-700 dark:text-green-300">✓ Your order qualifies for FREE Shipping</div>}
              <div className="space-y-2 text-sm mb-4">
                {[['Subtotal',`$${cartTotal.toFixed(2)}`],['Shipping',shipping===0?'FREE':`$${shipping.toFixed(2)}`],['Tax (8%)',`$${tax.toFixed(2)}`]].map(([l,v])=>(
                  <div key={l} className="flex justify-between"><span className="text-az-muted dark:text-dk-muted">{l}</span><span className={v==='FREE'?'text-az-green dark:text-dk-green font-medium':'text-az-text dark:text-dk-text'}>{v}</span></div>
                ))}
                <div className="flex justify-between font-bold text-base border-t border-az-border dark:border-dk-border pt-2"><span>Order Total:</span><span className="price">${total.toFixed(2)}</span></div>
              </div>
              <button onClick={()=>navigate('/checkout')} className="btn-primary w-full">Proceed to Checkout</button>
            </div>
            <div className="card p-3 text-xs text-az-muted dark:text-dk-muted space-y-1">
              <p>🔒 SSL Secured Checkout</p><p>✓ Verified by Stripe</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
