import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';

const CATS = [
  { name:'Electronics', img:'https://images.unsplash.com/photo-1498049794561-7780e7231661?w=200' },
  { name:'Clothing',    img:'https://images.unsplash.com/photo-1445205170230-053b83016050?w=200' },
  { name:'Home',        img:'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=200' },
  { name:'Sports',      img:'https://images.unsplash.com/photo-1461896836934-ffe607ba8211?w=200' },
  { name:'Books',       img:'https://images.unsplash.com/photo-1495446815901-a7297e633e8d?w=200' },
  { name:'Beauty',      img:'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=200' },
  { name:'Toys',        img:'https://images.unsplash.com/photo-1558877385-81a1c7e67d72?w=200' },
  { name:'Automotive',  img:'https://images.unsplash.com/photo-1503376780353-7e6692767b70?w=200' },
];

function BannerSlider() {
  const banners = [
    { bg:'from-az-dark to-az-nav', tag:'New Arrivals 2025', title:'Up to 40% Off Electronics', sub:'Top brands, unbeatable prices', cta:'Shop Electronics', link:'/products?category=Electronics' },
    { bg:'from-green-900 to-green-700', tag:'Limited Time', title:'Free Shipping On $100+', sub:'Delivered fast to your door', cta:'Shop Now', link:'/products' },
    { bg:'from-red-900 to-red-700', tag:'Flash Sale', title:"Today's Best Deals", sub:'New deals added every hour', cta:'See All Deals', link:'/products?flashSale=true' },
  ];
  const [i, setI] = useState(0);
  useEffect(() => { const t = setInterval(() => setI(n => (n+1)%banners.length), 5000); return () => clearInterval(t); }, []);
  const b = banners[i];
  return (
    <div className={`relative bg-gradient-to-r ${b.bg} overflow-hidden`}>
      <div className="max-w-[1500px] mx-auto px-5 py-14 md:py-20 relative z-10">
        <div className="max-w-lg">
          <span className="inline-block bg-az-orange text-white text-xs font-bold px-3 py-1 rounded-full mb-3">{b.tag}</span>
          <h1 className="text-white text-4xl md:text-5xl font-bold leading-tight mb-3">{b.title}</h1>
          <p className="text-white/80 text-base mb-6">{b.sub}</p>
          <Link to={b.link} className="btn-primary inline-block px-8 py-3 text-base">{b.cta}</Link>
        </div>
      </div>
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
        {banners.map((_,n) => <button key={n} onClick={() => setI(n)} className={`w-2 h-2 rounded-full transition-colors ${n===i?'bg-az-orange':'bg-white/40'}`}/>)}
      </div>
    </div>
  );
}

export default function Home() {
  const [featured, setFeatured] = useState([]);
  const [popular, setPopular] = useState([]);
  const [flash, setFlash] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get('/products?featured=true&limit=8'),
      api.get('/products?sort=popular&limit=8'),
      api.get('/products?flashSale=true&limit=4'),
    ]).then(([f, p, fs]) => {
      setFeatured(f.data.products || []);
      setPopular(p.data.products || []);
      setFlash(fs.data.products || []);
      setLoading(false);
    });
  }, []);

  return (
    <div className="bg-az-bg dark:bg-dk-bg">
      <BannerSlider />

      <div className="max-w-[1500px] mx-auto px-4 py-6 space-y-6">

        {/* Benefits */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[['🚚','Free Shipping','On orders over $100'],['🔒','Secure Payments','SSL encrypted'],['↩️','Easy Returns','30-day policy'],['⭐','Top Rated','Verified reviews']].map(([icon,title,sub]) => (
            <div key={title} className="card px-4 py-3 flex items-center gap-3">
              <span className="text-2xl">{icon}</span>
              <div><p className="font-bold text-az-text dark:text-dk-text text-sm">{title}</p><p className="text-az-muted dark:text-dk-sub text-xs">{sub}</p></div>
            </div>
          ))}
        </div>

        {/* Flash Sales */}
        {flash.length > 0 && (
          <section className="card overflow-hidden">
            <div className="bg-az-red px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-white font-bold text-lg">⚡ Flash Sales</span>
                <span className="text-white/80 text-sm">Limited time offers</span>
              </div>
              <Link to="/products?flashSale=true" className="text-white text-sm underline hover:no-underline">See all →</Link>
            </div>
            <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              {flash.map(p => <ProductCard key={p.id} product={p} />)}
            </div>
          </section>
        )}

        {/* Categories */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-az-text dark:text-dk-text">Shop by Category</h2>
            <Link to="/products" className="link text-sm">View all</Link>
          </div>
          <div className="grid grid-cols-4 md:grid-cols-8 gap-3">
            {CATS.map(({ name, img }) => (
              <Link key={name} to={`/products?category=${name}`}
                className="group flex flex-col items-center gap-2 p-2 rounded-lg hover:bg-az-bg dark:hover:bg-dk-border transition-colors cursor-pointer">
                <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-az-border dark:border-dk-border group-hover:border-az-orange transition-colors">
                  <img src={img} alt={name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                </div>
                <span className="text-[11px] font-medium text-az-text dark:text-dk-sub text-center group-hover:text-az-orange transition-colors">{name}</span>
              </Link>
            ))}
          </div>
        </section>

        {/* Featured */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-az-text dark:text-dk-text">⭐ Featured Products</h2>
            <Link to="/products?featured=true" className="link text-sm">See all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? Array(8).fill(0).map((_,i) => <ProductSkeleton key={i} />) : featured.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Banner strip */}
        <div className="bg-az-nav rounded overflow-hidden p-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div><h3 className="text-white font-bold text-xl mb-1">🔥 Best Sellers This Week</h3><p className="text-gray-300 text-sm">Most loved by our customers</p></div>
          <Link to="/products?sort=popular" className="btn-primary px-8 py-2.5 shrink-0">View Best Sellers</Link>
        </div>

        {/* Popular */}
        <section className="card p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold text-az-text dark:text-dk-text">🔥 Most Popular</h2>
            <Link to="/products?sort=popular" className="link text-sm">See all →</Link>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
            {loading ? Array(8).fill(0).map((_,i) => <ProductSkeleton key={i} />) : popular.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        </section>

        {/* Coupon strip */}
        <div className="card p-5 flex flex-col sm:flex-row items-center gap-4 justify-between bg-yellow-50 dark:bg-yellow-900/10 border-yellow-200 dark:border-yellow-800">
          <div><p className="font-bold text-az-text dark:text-dk-text">🎫 Got a coupon code?</p><p className="text-az-muted dark:text-dk-sub text-sm">Use it at checkout for instant savings. Try <strong className="text-az-orange">WELCOME10</strong> for 10% off your first order!</p></div>
          <Link to="/products" className="btn-primary shrink-0">Shop Now</Link>
        </div>
      </div>
    </div>
  );
}
