import { Link } from 'react-router-dom';
export default function Footer() {
  return (
    <footer>
      <button onClick={() => window.scrollTo({ top:0, behavior:'smooth' })} className="w-full bg-az-light hover:bg-az-nav text-white text-sm py-3 transition-colors">Back to top</button>
      <div className="bg-az-nav py-10">
        <div className="max-w-[1500px] mx-auto px-5 grid grid-cols-2 md:grid-cols-4 gap-8">
          {[['Get to Know Us',['About BEKI Shop','Careers','Press Releases']],['Make Money with Us',['Sell products','Become Affiliate','Advertise']],['Payment',['BEKI Card','Shop with Points','Currency Converter']],['Let Us Help You',['Your Account','Your Orders','Shipping Policy','Returns','Help']]].map(([title, links]) => (
            <div key={title}>
              <h3 className="text-white font-bold text-sm mb-3">{title}</h3>
              <ul className="space-y-2">{links.map(l => <li key={l}><a href="#" className="text-gray-300 text-xs hover:text-white hover:underline transition-colors">{l}</a></li>)}</ul>
            </div>
          ))}
        </div>
      </div>
      <div className="bg-az-dark py-5 text-center">
        <Link to="/" className="inline-flex gap-0.5 mb-3">
          <span className="text-white font-bold text-lg">Shop</span>
          <span className="text-az-orange font-bold text-lg">Sphere</span>
        </Link>
        <p className="text-gray-400 text-xs">© {new Date().getFullYear()} BEKI Shop. All rights reserved.</p>
      </div>
    </footer>
  );
}
