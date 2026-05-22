import { Link } from 'react-router-dom';
import { useWishlist } from '../context/WishlistContext';
import ProductCard from '../components/ProductCard';
export default function Wishlist() {
  const { wishlist } = useWishlist();
  return (
    <div className="max-w-[1500px] mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold text-az-text dark:text-dk-text mb-6">Wishlist ({wishlist.products?.length||0})</h1>
      {!(wishlist.products?.length) ? <div className="card p-16 text-center"><p className="text-4xl mb-4">❤️</p><h2 className="font-bold text-az-text dark:text-dk-text mb-2">Wishlist is empty</h2><Link to="/products" className="btn-primary text-sm mt-2 inline-block">Discover Products</Link></div>
      : <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">{wishlist.products.map(p => <ProductCard key={p.id} product={p}/>)}</div>}
    </div>
  );
}
