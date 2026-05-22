import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import { Stars } from '../components/ProductCard';
import toast from 'react-hot-toast';

export default function ProductDetail() {
  const { id } = useParams();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [qty, setQty] = useState(1);
  const [tab, setTab] = useState('description');
  const [review, setReview] = useState({ rating:5, title:'', comment:'' });
  const [submitting, setSubmitting] = useState(false);
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    api.get(`/products/${id}`).then(({ data }) => { setProduct(data); setLoading(false); }).catch(() => navigate('/products'));
  }, [id]);

  const effectivePrice = product?.isFlashSale && product?.flashSalePrice && new Date(product?.flashSaleEnds) > new Date()
    ? Number(product.flashSalePrice) : Number(product?.price || 0);
  const original = Number(product?.originalPrice || 0);
  const discount = original > effectivePrice ? Math.round(((original - effectivePrice) / original) * 100) : 0;

  const handleAdd = async () => {
    if (!user) { navigate('/login'); return; }
    try { await addToCart(product.id, qty); toast.success(`${qty}× added to cart`); }
    catch { toast.error('Failed to add'); }
  };
  const handleBuyNow = async () => {
    if (!user) { navigate('/login'); return; }
    try { await addToCart(product.id, qty); navigate('/cart'); }
    catch { toast.error('Failed'); }
  };
  const handleReview = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    setSubmitting(true);
    try {
      await api.post(`/products/${id}/reviews`, review);
      toast.success('Review submitted!');
      const { data } = await api.get(`/products/${id}`);
      setProduct(data);
      setReview({ rating:5, title:'', comment:'' });
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setSubmitting(false); }
  };

  if (loading) return (
    <div className="max-w-[1500px] mx-auto px-4 py-6 grid md:grid-cols-[1fr_1fr_280px] gap-6">
      <div className="skeleton aspect-square rounded" />
      <div className="space-y-3">{Array(6).fill(0).map((_,i) => <div key={i} className={`skeleton h-4 ${i%2===0?'w-full':'w-2/3'}`}/>)}</div>
      <div className="skeleton h-64 rounded" />
    </div>
  );

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-az-muted dark:text-dk-muted mb-4 flex items-center gap-1 flex-wrap">
        <Link to="/" className="link">Home</Link><span>›</span>
        <Link to="/products" className="link">Products</Link><span>›</span>
        <Link to={`/products?category=${product.category}`} className="link">{product.category}</Link><span>›</span>
        <span className="text-az-text dark:text-dk-text line-clamp-1">{product.name}</span>
      </nav>

      <div className="grid md:grid-cols-[1fr_1fr_280px] gap-5 mb-6">
        {/* Image */}
        <div className="card p-6 flex items-center justify-center aspect-square">
          <img src={product.image} alt={product.name} className="w-full max-h-80 object-contain" />
        </div>

        {/* Info */}
        <div className="card p-5">
          <p className="text-az-muted dark:text-dk-muted text-xs uppercase tracking-wide mb-1">{product.brand}</p>
          <h1 className="text-xl font-medium text-az-text dark:text-dk-text mb-3 leading-snug">{product.name}</h1>
          <div className="flex items-center gap-3 mb-4 pb-4 border-b border-az-border dark:border-dk-border">
            <Stars rating={product.rating} count={product.numReviews} />
            <span className="text-az-muted dark:text-dk-muted text-xs">|</span>
            <span className="text-az-muted dark:text-dk-muted text-xs">{product.sold} sold</span>
          </div>
          {product.isFlashSale && new Date(product.flashSaleEnds) > new Date() && (
            <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2 mb-4">
              <span className="text-az-red dark:text-dk-red font-bold text-sm">⚡ Flash Sale — Limited time!</span>
            </div>
          )}
          <div className="mb-4 pb-4 border-b border-az-border dark:border-dk-border">
            <div className="flex items-baseline gap-3 mb-1">
              <span className="text-xs text-az-muted dark:text-dk-muted">Price:</span>
              <span className="text-2xl price">${effectivePrice.toFixed(2)}</span>
              {original > effectivePrice && (
                <div className="flex items-center gap-2">
                  <span className="text-az-muted dark:text-dk-muted line-through text-sm">${original.toFixed(2)}</span>
                  <span className="badge badge-red">Save {discount}%</span>
                </div>
              )}
            </div>
            {effectivePrice >= 100 && <p className="link text-sm">✓ FREE Delivery on orders over $100</p>}
          </div>
          <p className="text-az-text dark:text-dk-text text-sm leading-relaxed mb-4">{product.description}</p>
          {product.tags?.length > 0 && (
            <div className="flex flex-wrap gap-2 mb-4">
              {product.tags.map(t => <span key={t} className="text-xs bg-az-bg dark:bg-dk-border border border-az-border dark:border-dk-border rounded-full px-3 py-1 text-az-muted dark:text-dk-muted">{t}</span>)}
            </div>
          )}
          <div className="grid grid-cols-2 gap-3">
            {[['Brand',product.brand],['Category',product.category],['Rating',`${Number(product.rating).toFixed(1)}/5`],['Stock',product.stock]].map(([k,v]) => (
              <div key={k} className="bg-az-bg dark:bg-dk-nav rounded p-3">
                <p className="text-xs text-az-muted dark:text-dk-muted mb-0.5">{k}</p>
                <p className="text-sm font-bold text-az-text dark:text-dk-text">{v}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Buy box */}
        <div className="space-y-3">
          <div className="card p-4">
            <p className="text-2xl price mb-3">${effectivePrice.toFixed(2)}</p>
            <p className={`text-sm font-bold mb-4 ${product.stock > 0 ? 'text-az-green dark:text-dk-green' : 'text-az-red dark:text-dk-red'}`}>
              {product.stock > 0 ? `In Stock (${product.stock} available)` : 'Out of Stock'}
            </p>
            {product.stock > 0 && (<>
              <div className="flex items-center gap-3 mb-4">
                <label className="label mb-0">Qty:</label>
                <select value={qty} onChange={e => setQty(Number(e.target.value))} className="input py-1 w-20 text-sm">
                  {Array.from({length:Math.min(product.stock,10)},(_,i)=>i+1).map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
              <div className="space-y-2">
                <button onClick={handleAdd} className="btn-primary w-full">Add to Cart</button>
                <button onClick={handleBuyNow} className="btn-orange w-full">Buy Now</button>
              </div>
            </>)}
            <button onClick={() => toggle(product.id)} className={`btn-secondary w-full mt-2 flex items-center justify-center gap-2 text-sm ${isWishlisted(product.id)?'border-red-300 text-az-red dark:text-dk-red':''}`}>
              <svg className="w-4 h-4" fill={isWishlisted(product.id)?'currentColor':'none'} stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"/></svg>
              {isWishlisted(product.id) ? 'Saved' : 'Add to Wishlist'}
            </button>
          </div>
          <div className="card p-4 text-xs text-az-muted dark:text-dk-muted space-y-2">
            <p>🔒 Secure transaction</p>
            <p>↩️ 30-day return policy</p>
            <p>📦 Ships from BEKI Shop</p>
            <p>✉️ Email confirmation on order</p>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="card">
        <div className="flex border-b border-az-border dark:border-dk-border">
          {[['description','Description'],['reviews',`Reviews (${product.numReviews})`]].map(([t,l]) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-6 py-3 text-sm font-medium transition-colors ${tab===t?'border-b-2 border-az-orange text-az-orange':'text-az-muted dark:text-dk-muted hover:text-az-text dark:hover:text-dk-text'}`}>
              {l}
            </button>
          ))}
        </div>
        <div className="p-5">
          {tab === 'description' ? (
            <p className="text-az-text dark:text-dk-text text-sm leading-relaxed">{product.description}</p>
          ) : (
            <div>
              {product.reviews?.length === 0 ? <p className="text-az-muted dark:text-dk-muted">No reviews yet. Be the first!</p> : (
                <div className="space-y-5 mb-6">
                  {product.reviews.map(r => (
                    <div key={r.id} className="border-b border-az-border dark:border-dk-border pb-5">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="w-8 h-8 rounded-full bg-az-nav text-white text-xs flex items-center justify-center font-bold">{r.userName?.[0]?.toUpperCase()}</div>
                        <div>
                          <p className="font-bold text-sm text-az-text dark:text-dk-text">{r.userName}</p>
                          <p className="text-xs text-az-muted dark:text-dk-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
                        </div>
                        {r.isVerifiedPurchase && <span className="badge badge-orange ml-auto">✓ Verified</span>}
                      </div>
                      <Stars rating={r.rating} />
                      {r.title && <p className="font-bold text-sm text-az-text dark:text-dk-text mt-1">{r.title}</p>}
                      <p className="text-az-text dark:text-dk-text text-sm mt-1">{r.comment}</p>
                    </div>
                  ))}
                </div>
              )}
              {user && (
                <form onSubmit={handleReview} className="bg-az-bg dark:bg-dk-nav rounded p-5">
                  <h4 className="font-bold text-az-text dark:text-dk-text mb-4">Write a Customer Review</h4>
                  <div className="mb-4">
                    <label className="label">Rating</label>
                    <div className="flex gap-2">
                      {[1,2,3,4,5].map(n => (
                        <button type="button" key={n} onClick={() => setReview(r => ({ ...r, rating:n }))}
                          className={`text-2xl transition-transform hover:scale-125 ${n<=review.rating?'text-az-orange':'text-gray-300 dark:text-gray-600'}`}>★</button>
                      ))}
                    </div>
                  </div>
                  <div className="mb-3">
                    <label className="label">Review Title</label>
                    <input value={review.title} onChange={e => setReview(r => ({...r,title:e.target.value}))} className="input" placeholder="Give your review a headline" />
                  </div>
                  <div className="mb-4">
                    <label className="label">Review</label>
                    <textarea rows={3} required value={review.comment} onChange={e => setReview(r => ({...r,comment:e.target.value}))} className="input resize-none" placeholder="Share your experience..." />
                  </div>
                  <button type="submit" disabled={submitting} className="btn-primary text-sm">{submitting?'Submitting...':'Submit Review'}</button>
                </form>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
