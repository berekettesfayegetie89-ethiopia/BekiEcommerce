import { useEffect, useState, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import api from '../api/axios';
import ProductCard from '../components/ProductCard';
import { ProductSkeleton } from '../components/Skeletons';

const CATS = ['Electronics','Clothing','Home','Sports','Books','Beauty','Toys','Automotive'];
const SORTS = [['','Featured'],['newest','Newest'],['popular','Best Sellers'],['price_asc','Price: Low–High'],['price_desc','Price: High–Low'],['rating','Top Rated']];

export default function Products() {
  const [sp, setSP] = useSearchParams();
  const [data, setData] = useState({ products:[], total:0, pages:1 });
  const [loading, setLoading] = useState(true);
  const cat = sp.get('category')||'', sort = sp.get('sort')||'', search = sp.get('search')||'';
  const featured = sp.get('featured')||'', flashSale = sp.get('flashSale')||'', page = Number(sp.get('page')||1);

  const upd = useCallback((k, v) => {
    const p = Object.fromEntries(sp);
    if (v) p[k] = v; else delete p[k];
    if (k !== 'page') delete p.page;
    setSP(p);
  }, [sp, setSP]);

  useEffect(() => {
    setLoading(true);
    const params = { page, limit:16 };
    if (cat) params.category = cat;
    if (sort) params.sort = sort;
    if (search) params.search = search;
    if (featured) params.featured = featured;
    if (flashSale) params.flashSale = flashSale;
    api.get('/products', { params }).then(({ data }) => { setData(data); setLoading(false); });
  }, [cat, sort, search, featured, flashSale, page]);

  return (
    <div className="max-w-[1500px] mx-auto px-4 py-5">
      {/* Breadcrumb */}
      <nav className="text-xs text-az-muted dark:text-dk-muted mb-4 flex items-center gap-1 flex-wrap">
        <a href="/" className="link">Home</a><span>›</span>
        {cat ? <><a href="/products" className="link">All</a><span>›</span><span className="text-az-text dark:text-dk-text">{cat}</span></> : <span>All Products</span>}
        {search && <><span>›</span><span>"{search}"</span></>}
      </nav>

      <div className="flex gap-5">
        {/* Sidebar */}
        <aside className="hidden lg:block w-56 shrink-0 space-y-4">
          <div className="card p-4">
            <h3 className="font-bold text-az-text dark:text-dk-text text-sm mb-3 border-b border-az-border dark:border-dk-border pb-2">Department</h3>
            <ul className="space-y-0.5">
              <li><button onClick={() => upd('category','')} className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${!cat?'font-bold text-az-orange':'text-az-link dark:text-dk-blue hover:text-az-red dark:hover:text-dk-red'}`}>All Departments</button></li>
              {CATS.map(c => <li key={c}><button onClick={() => upd('category',c)} className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${cat===c?'font-bold text-az-orange':'text-az-link dark:text-dk-blue hover:text-az-red dark:hover:text-dk-red'}`}>{c}</button></li>)}
            </ul>
          </div>
          <div className="card p-4">
            <h3 className="font-bold text-az-text dark:text-dk-text text-sm mb-3 border-b border-az-border dark:border-dk-border pb-2">Price</h3>
            {[['','','All Prices'],['0','25','Under $25'],['25','50','$25–$50'],['50','100','$50–$100'],['100','200','$100–$200'],['200','','$200+']].map(([mn,mx,label]) => (
              <button key={label} onClick={() => { upd('minPrice',mn); upd('maxPrice',mx); }}
                className="block w-full text-left text-sm text-az-link dark:text-dk-blue hover:text-az-red dark:hover:text-dk-red px-2 py-1.5 rounded transition-colors">
                {label}
              </button>
            ))}
          </div>
          <div className="card p-4">
            <h3 className="font-bold text-az-text dark:text-dk-text text-sm mb-3 border-b border-az-border dark:border-dk-border pb-2">Deals</h3>
            <button onClick={() => upd('flashSale', flashSale ? '' : 'true')}
              className={`w-full text-left text-sm px-2 py-1.5 rounded transition-colors ${flashSale?'font-bold text-az-orange':'text-az-link dark:text-dk-blue hover:text-az-red'}`}>
              ⚡ Flash Sales Only
            </button>
          </div>
        </aside>

        {/* Main */}
        <div className="flex-1 min-w-0">
          {/* Sort bar */}
          <div className="card px-4 py-3 flex flex-wrap items-center justify-between gap-3 mb-4">
            <p className="text-az-text dark:text-dk-text text-sm">
              {!loading && <>{data.total.toLocaleString()} results{search && <> for <strong>"{search}"</strong></>}</>}
            </p>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-az-muted dark:text-dk-muted font-medium">Sort:</span>
              <select value={sort} onChange={e => upd('sort', e.target.value)} className="input py-1 w-auto text-sm">
                {SORTS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </div>
          </div>

          {/* Mobile category pills */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-4 lg:hidden">
            {['All',...CATS].map(c => (
              <button key={c} onClick={() => upd('category', c==='All'?'':c)}
                className={`shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors ${(c==='All'&&!cat)||cat===c?'bg-az-orange text-white border-az-orange':'border-az-border dark:border-dk-border text-az-text dark:text-dk-text hover:border-az-orange'}`}>
                {c}
              </button>
            ))}
          </div>

          {/* Grid */}
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">{Array(16).fill(0).map((_,i) => <ProductSkeleton key={i}/>)}</div>
          ) : data.products.length === 0 ? (
            <div className="card p-16 text-center">
              <p className="text-3xl mb-3">🔍</p>
              <p className="font-bold text-az-text dark:text-dk-text mb-2">No results found</p>
              <p className="text-az-muted dark:text-dk-muted text-sm mb-4">Try adjusting your search or filters</p>
              <button onClick={() => setSP({})} className="btn-primary text-sm">Clear all filters</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {data.products.map(p => <ProductCard key={p.id} product={p}/>)}
            </div>
          )}

          {/* Pagination */}
          {data.pages > 1 && (
            <div className="flex justify-center gap-1 mt-6">
              {Array.from({length:data.pages},(_,i)=>i+1).map(p => (
                <button key={p} onClick={() => upd('page',p)}
                  className={`w-9 h-9 text-sm rounded border transition-colors ${p===page?'bg-az-orange text-white border-az-orange font-bold':'border-az-border dark:border-dk-border text-az-link dark:text-dk-blue hover:bg-az-bg dark:hover:bg-dk-border'}`}>
                  {p}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
