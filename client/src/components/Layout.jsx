import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
export default function Layout() {
  return (
    <div className="flex flex-col min-h-screen bg-az-bg dark:bg-dk-bg transition-colors duration-200">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
