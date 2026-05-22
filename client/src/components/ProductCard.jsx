import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useWishlist } from '../context/WishlistContext';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export function Stars({ rating, count, size = 'sm' }) {
  const r = Number(rating) || 0;
  const full = Math.floor(r), half = r % 1 >= 0.5;
  return (
    <div className="flex items-center gap-1">
      <div className={`flex stars ${size === 'lg' ? 'text-xl' : 'text-sm'}`}>
        {[1,2,3,4,5].map(i => <span key={i}>{i <= full ? '★' : (i === full+1 && half) ? '½' : '☆'}</span>)}
      </div>
      {count !== undefined && <span className="link text-xs">({count.toLocaleString()})</span>}
    </div>
  );
}

export default function ProductCard({ product }) {
  const { addToCart } = useCart();
  const { toggle, isWishlisted } = useWishlist();
  const { user } = useAuth();
  const navigate = useNavigate();
  const wishlisted = isWishlisted(product.id);

  const price = product.isFlashSale && product.flashSalePrice && new Date(product.flashSaleEnds) > new Date()
    ? Number(product.flashSalePrice)
    : Number(product.price);
  const original = Number(product.originalPrice);
  const discount = original > price ? Math.round(((original - price) / original) * 100) : 0;

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try { await addToCart(product.id, 1); toast.success('Added to cart'); }
    catch { toast.error('Failed to add'); }
  };
  const handleWishlist = async (e) => {
    e.preventDefault();
    if (!user) { navigate('/login'); return; }
    try { const added = await toggle(product.id); toast.success(added ? 'Added to wishlist' : 'Removed from wishlist'); }
    catch (err) { if (err.response?.status !== 400) toast.error('Failed'); }
  };

  return (
    <div className="card-hover group relative flex flex-col h-full">
      {/* Badges */}
      <div className="absolute top-2 left-2 z-10 flex flex-col gap-1">
        {product.isFlashSale && new Date(product.flashSaleEnds) > new Date() && (
          <span className="badge bg-az-red text-white">⚡ Flash</span>
        )}
        {discount > 0 && !product.isFlashSale && (
          <span className="badge bg-az-red text-white">-{discount}%</span>
        )}
        {product.isFeatured && <span className="badge bg-az-orange text-white">Featured</span>}
      </div>

      {/* Wishlist */}
      <button onClick={handleWishlist}
        className={`absolute top-2 right-2 z-10 w-8 h-8 rounded-full shadow-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all hover:scale-110 ${wishlisted ? 'bg-red-50 text-az-red' : 'bg-white dark:bg-dk-card text-az-muted hover:text-az-red'}`}>
        <svg className="w-4 h-4" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
        </svg>
      </button>

      <Link to={`/products/${product.id}`}>
        <div className="aspect-square bg-white dark:bg-dk-nav border-b border-az-border dark:border-dk-border overflow-hidden rounded-t">
          <img src={product.image} alt={product.name}
            className="w-full h-full object-contain p-4 group-hover:scale-105 transition-transform duration-300" />
        </div>
      </Link>

      <div className="p-3 flex flex-col flex-1 bg-az-card dark:bg-dk-card rounded-b">
        <p className="text-az-muted dark:text-dk-sub text-[11px] uppercase tracking-wider mb-1">{product.brand}</p>
        <Link to={`/products/${product.id}`}>
          <h3 className="text-az-text dark:text-dk-text text-sm font-medium line-clamp-2 hover:text-az-link dark:hover:text-dk-blue transition-colors mb-1 leading-snug">{product.name}</h3>
        </Link>
        <Stars rating={product.rating} count={product.numReviews} />
        <div className="mt-2 mb-3">
          <div className="flex items-baseline gap-2 flex-wrap">
            <span className="price text-lg">${price.toFixed(2)}</span>
            {original > price && <span className="text-az-muted dark:text-dk-muted text-xs line-through">${original.toFixed(2)}</span>}
            {discount > 0 && <span className="text-az-red dark:text-dk-red text-xs font-bold">Save {discount}%</span>}
          </div>
          {price >= 100 && <p className="link text-xs mt-0.5">FREE Shipping</p>}
          {product.stock === 0 && <p className="text-az-red dark:text-dk-red text-xs font-bold mt-1">Out of Stock</p>}
          {product.stock > 0 && product.stock <= 5 && <p className="text-az-red dark:text-dk-red text-xs font-bold mt-1">Only {product.stock} left!</p>}
        </div>
        <button onClick={handleAdd} disabled={product.stock === 0}
          className="btn-primary w-full mt-auto disabled:opacity-40 disabled:cursor-not-allowed">
          {product.stock === 0 ? 'Out of Stock' : 'Add to Cart'}
        </button>
      </div>
    </div>
  );
}
