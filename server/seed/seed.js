require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { sequelize, testConnection } = require('../db/connection');
const { User, Product, Cart, Order, Wishlist, Coupon } = require('../models/index');

const products = [
  { name: 'Sony WH-1000XM5 Wireless Headphones', description: 'Industry-leading noise cancellation with 30-hour battery life. Multipoint connection lets you pair with two devices simultaneously. Crystal clear hands-free calling with 8 microphones.', price: 279.99, originalPrice: 349.99, category: 'Electronics', brand: 'Sony', image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600', stock: 45, rating: 4.8, sold: 230, isFeatured: true, isFlashSale: false, tags: ['headphones','wireless','noise-cancelling'] },
  { name: 'Apple Watch Series 9 GPS 45mm', description: 'Advanced health sensors including blood oxygen, ECG, and crash detection. Always-on Retina LTPO display with 2000 nit brightness. Water resistant to 50 meters.', price: 399.99, originalPrice: 429.99, category: 'Electronics', brand: 'Apple', image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600', stock: 30, rating: 4.7, sold: 185, isFeatured: true, isFlashSale: true, flashSalePrice: 349.99, flashSaleEnds: new Date(Date.now() + 48*60*60*1000), tags: ['smartwatch','fitness','apple'] },
  { name: 'Logitech MX Master 3S Wireless Mouse', description: 'Ultra-fast MagSpeed scrolling, 8K DPI sensor, whisper-quiet clicks. Works on any surface including glass. 70 days battery. Ergonomic design for all-day use.', price: 99.99, originalPrice: 119.99, category: 'Electronics', brand: 'Logitech', image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=600', stock: 80, rating: 4.6, sold: 312, isFeatured: false, isFlashSale: false, tags: ['mouse','wireless','productivity'] },
  { name: 'Samsung 27" 4K UHD Monitor', description: '4K UHD IPS panel with 99% sRGB color gamut. USB-C with 65W power delivery, HDR10 support. Perfect for design, gaming, and productivity.', price: 449.99, originalPrice: 549.99, category: 'Electronics', brand: 'Samsung', image: 'https://images.unsplash.com/photo-1593642632559-0c6d3fc62b89?w=600', stock: 25, rating: 4.5, sold: 98, isFeatured: true, isFlashSale: false, tags: ['monitor','4k','professional'] },
  { name: 'Keychron K2 Pro Mechanical Keyboard', description: 'Compact 75% layout with hot-swappable switches and RGB backlight. Works with Mac and Windows. Premium aluminum frame. Bluetooth 5.1 + USB-C.', price: 89.99, originalPrice: 109.99, category: 'Electronics', brand: 'Keychron', image: 'https://images.unsplash.com/photo-1587829741301-dc798b83add3?w=600', stock: 60, rating: 4.7, sold: 275, isFeatured: false, isFlashSale: true, flashSalePrice: 69.99, flashSaleEnds: new Date(Date.now() + 24*60*60*1000), tags: ['keyboard','mechanical','RGB'] },
  { name: 'Anker 65W GaN USB-C Charger', description: 'GaN technology delivers fast charging for laptop, tablet, and phone simultaneously. Folds flat for travel. Supports PD 3.0 and Quick Charge 4.0.', price: 35.99, originalPrice: 45.99, category: 'Electronics', brand: 'Anker', image: 'https://images.unsplash.com/photo-1586495777744-4e6232bf8f7f?w=600', stock: 120, rating: 4.5, sold: 542, isFeatured: false, isFlashSale: false, tags: ['charger','fast-charging','GaN'] },
  { name: "Levi's 511 Slim Fit Jeans", description: 'Classic 5-pocket styling in a slim fit that sits below the waist. Stretch denim for all-day comfort. The iconic American jean, updated for today.', price: 59.99, originalPrice: 79.99, category: 'Clothing', brand: "Levi's", image: 'https://images.unsplash.com/photo-1542272454315-4c01d7abdf4a?w=600', stock: 90, rating: 4.4, sold: 420, isFeatured: true, isFlashSale: false, tags: ['jeans','denim','slim'] },
  { name: 'Nike Air Max 270 Sneakers', description: 'Max Air unit in heel for lightweight all-day cushioning. Breathable mesh upper with foam midsole. Available in multiple colorways.', price: 149.99, originalPrice: 180.00, category: 'Clothing', brand: 'Nike', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600', stock: 55, rating: 4.6, sold: 380, isFeatured: true, isFlashSale: false, tags: ['sneakers','running','nike'] },
  { name: 'Champion Reverse Weave Hoodie', description: 'Classic reverse weave construction reduces shrinkage and maintains shape. Ribbed waistband and cuffs. 82% cotton, 18% polyester for perfect comfort.', price: 65.00, originalPrice: 80.00, category: 'Clothing', brand: 'Champion', image: 'https://images.unsplash.com/photo-1556821840-3a63f15732ce?w=600', stock: 70, rating: 4.3, sold: 210, isFeatured: false, isFlashSale: false, tags: ['hoodie','casual','streetwear'] },
  { name: 'Nespresso Vertuo Next Coffee Machine', description: 'Centrifusion brewing technology for barista-quality coffee at home. Automatically recognizes 30+ capsule sizes. WiFi connected for firmware updates.', price: 159.99, originalPrice: 199.99, category: 'Home', brand: 'Nespresso', image: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=600', stock: 40, rating: 4.6, sold: 145, isFeatured: true, isFlashSale: false, tags: ['coffee','espresso','kitchen'] },
  { name: 'Dyson V8 Cordless Vacuum', description: 'Powerful suction with 40 minutes of fade-free power. Transforms to handheld in one click. Whole machine filtration captures allergens and bacteria.', price: 349.99, originalPrice: 449.99, category: 'Home', brand: 'Dyson', image: 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=600', stock: 20, rating: 4.7, sold: 92, isFeatured: true, isFlashSale: false, tags: ['vacuum','cordless','cleaning'] },
  { name: 'Casper Essential Pillow', description: 'Ergonomic memory foam with adaptive support for all sleep positions. Breathable AirScape cover wicks heat away. 5-year warranty.', price: 79.99, originalPrice: 99.99, category: 'Home', brand: 'Casper', image: 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2?w=600', stock: 65, rating: 4.5, sold: 287, isFeatured: false, isFlashSale: false, tags: ['pillow','sleep','memory-foam'] },
  { name: 'Hydro Flask 32oz Wide Mouth', description: 'TempShield double-wall insulation keeps cold 24hrs and hot 12hrs. Pro-grade 18/8 stainless steel. BPA-free. Lifetime warranty.', price: 44.95, originalPrice: 49.95, category: 'Sports', brand: 'Hydro Flask', image: 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=600', stock: 150, rating: 4.8, sold: 623, isFeatured: false, isFlashSale: false, tags: ['water-bottle','outdoor','hydration'] },
  { name: 'Manduka PRO Yoga Mat', description: 'The most durable yoga mat ever made — backed by a lifetime guarantee. Dense 6mm cushioning for joint support. Closed-cell surface prevents bacteria.', price: 128.00, originalPrice: 148.00, category: 'Sports', brand: 'Manduka', image: 'https://images.unsplash.com/photo-1601925228008-35e89ea5e0a7?w=600', stock: 45, rating: 4.7, sold: 178, isFeatured: true, isFlashSale: false, tags: ['yoga','fitness','mat'] },
  { name: 'Atomic Habits by James Clear', description: 'The #1 New York Times bestseller with over 15 million copies sold. An easy and proven way to build good habits and break bad ones.', price: 16.99, originalPrice: 27.00, category: 'Books', brand: 'Avery Publishing', image: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=600', stock: 300, rating: 4.9, sold: 892, isFeatured: true, isFlashSale: false, tags: ['self-help','habits','bestseller'] },
  { name: 'The Pragmatic Programmer 20th Ed', description: "From journeyman to master. Essential guide for every developer. Covers modern software development best practices. Perfect for juniors and seniors alike.", price: 49.99, originalPrice: 59.99, category: 'Books', brand: 'Pragmatic Bookshelf', image: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?w=600', stock: 150, rating: 4.8, sold: 445, isFeatured: false, isFlashSale: false, tags: ['programming','developer','software'] },
  { name: 'CeraVe Moisturizing Cream 16oz', description: 'Developed with dermatologists. Contains ceramides and hyaluronic acid to restore skin barrier. Fragrance-free, non-comedogenic. For normal to dry skin.', price: 19.99, originalPrice: 24.99, category: 'Beauty', brand: 'CeraVe', image: 'https://images.unsplash.com/photo-1620916566398-39f1143ab7be?w=600', stock: 200, rating: 4.8, sold: 756, isFeatured: false, isFlashSale: true, flashSalePrice: 14.99, flashSaleEnds: new Date(Date.now() + 12*60*60*1000), tags: ['skincare','moisturizer','dermatologist'] },
  { name: 'Olaplex No.3 Hair Perfector', description: 'At-home treatment that reduces breakage and visibly strengthens hair. For all hair types. Works on color-treated, damaged, or natural hair. Use weekly.', price: 30.00, originalPrice: 38.00, category: 'Beauty', brand: 'Olaplex', image: 'https://images.unsplash.com/photo-1522337360788-8b13dee7a37e?w=600', stock: 80, rating: 4.6, sold: 334, isFeatured: true, isFlashSale: false, tags: ['hair','treatment','repair'] },
  { name: 'LEGO Technic Bugatti Chiron', description: '3,599 pieces in 1:8 scale with working 8-speed gearbox, all-wheel drive, and rear spoiler. A prestige build for adult LEGO enthusiasts.', price: 349.99, originalPrice: 399.99, category: 'Toys', brand: 'LEGO', image: 'https://images.unsplash.com/photo-1563901935883-cb61f1e7a70b?w=600', stock: 15, rating: 4.9, sold: 47, isFeatured: true, isFlashSale: false, tags: ['lego','technic','car'] },
  { name: 'Resistance Bands Set 5-Pack', description: 'Set of 5 latex bands for full-body workouts. Color-coded by resistance level from light to extra-heavy. Includes door anchor, ankle straps, and carry bag.', price: 24.99, originalPrice: 34.99, category: 'Sports', brand: 'TheraBand', image: 'https://images.unsplash.com/photo-1598971861713-54ad16a7e72e?w=600', stock: 200, rating: 4.5, sold: 511, isFeatured: false, isFlashSale: false, tags: ['fitness','resistance','home-gym'] },
];

const coupons = [
  { code: 'WELCOME10', type: 'percentage', value: 10, minOrderAmount: 0, maxUsage: 1000, isActive: true, expiresAt: new Date(Date.now() + 365*24*60*60*1000) },
  { code: 'SAVE20', type: 'percentage', value: 20, minOrderAmount: 100, maxUsage: 500, isActive: true, expiresAt: new Date(Date.now() + 30*24*60*60*1000) },
  { code: 'FLAT15', type: 'fixed', value: 15, minOrderAmount: 75, maxUsage: 200, isActive: true, expiresAt: new Date(Date.now() + 60*24*60*60*1000) },
  { code: 'BEKI50', type: 'fixed', value: 50, minOrderAmount: 200, maxUsage: 100, isActive: true, expiresAt: new Date(Date.now() + 14*24*60*60*1000) },
];

async function seed() {
  try {
    await testConnection();
    await sequelize.sync({ force: true });
    console.log('✅ Tables created fresh');

    await User.create({ name: 'Beki Admin', email: 'admin@bekishop.com', password: 'admin123', isAdmin: true });
    console.log('👤 Admin: admin@bekishop.com / admin123');
    await User.create({ name: 'John Doe', email: 'john@example.com', password: 'user123' });
    await User.create({ name: 'Jane Smith', email: 'jane@example.com', password: 'user123' });
    console.log('👥 2 sample customers created');

    await Product.bulkCreate(products);
    console.log(`📦 ${products.length} products inserted`);

    await Coupon.bulkCreate(coupons);
    console.log(`🎫 ${coupons.length} coupon codes created:`);
    coupons.forEach(c => console.log(`   ${c.code} — ${c.type === 'percentage' ? c.value + '% off' : '$' + c.value + ' off'}`));

    console.log('\n🎉 BEKI Shop database seeded!');
    console.log('   Run: npm run dev\n');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed error:', err.message);
    process.exit(1);
  }
}

seed();
