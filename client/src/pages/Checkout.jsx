import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';
import { useCart } from '../context/CartContext';
import toast from 'react-hot-toast';

const STEPS = ['Shipping', 'Payment', 'Review'];

// ── Payment method config ────────────────────────────────────────────────────
const PAYMENT_METHODS = [
  {
    id: 'chapa',
    label: '💳 All Ethiopian Payments',
    sub: 'Telebirr · CBEBirr · M-Pesa · Amole · Card — choose on next page',
    badge: 'Most Popular',
    badgeColor: 'bg-green-500',
    color: 'border-green-500 bg-green-50 dark:bg-green-900/10',
    icon: '🇪🇹',
  },
  {
    id: 'telebirr',
    label: '📱 Telebirr',
    sub: 'Pay directly with your Telebirr wallet (Ethio Telecom)',
    icon: '📱',
    color: 'border-blue-400',
  },
  {
    id: 'cbebirr',
    label: '🏦 CBEBirr',
    sub: 'Commercial Bank of Ethiopia mobile banking',
    icon: '🏦',
    color: 'border-yellow-500',
  },
  {
    id: 'mpesa',
    label: '🟢 M-Pesa',
    sub: 'Safaricom M-Pesa mobile money',
    icon: '🟢',
    color: 'border-green-600',
  },
  {
    id: 'amole',
    label: '⚡ Amole',
    sub: 'Dashen Bank Amole digital wallet',
    icon: '⚡',
    color: 'border-purple-500',
  },
  {
    id: 'cod',
    label: '💵 Cash on Delivery',
    sub: 'Pay cash when your order arrives',
    icon: '💵',
    color: 'border-gray-400',
  },
];

const CHAPA_METHODS = ['chapa', 'telebirr', 'cbebirr', 'mpesa', 'amole'];

export default function Checkout() {
  const { cart, cartTotal } = useCart();
  const navigate = useNavigate();

  const [step, setStep]               = useState(0);
  const [loading, setLoading]         = useState(false);
  const [addr, setAddr]               = useState({ fullName:'', address:'', city:'', postalCode:'', country:'Ethiopia', phone:'' });
  const [pm, setPm]                   = useState('chapa');
  const [couponCode, setCouponCode]   = useState('');
  const [couponResult, setCouponResult] = useState(null);
  const [couponLoading, setCouponLoading] = useState(false);
  const [etbRate, setEtbRate]         = useState(130);
  const [redirecting, setRedirecting] = useState(false);

  // Load ETB rate
  useEffect(() => {
    api.get('/orders/etb-rate')
      .then(r => setEtbRate(r.data.rate))
      .catch(() => {});
  }, []);

  const discount      = couponResult?.discount || 0;
  const afterDiscount = Math.max(0, cartTotal - discount);
  const shipping      = afterDiscount >= 100 ? 0 : afterDiscount > 0 ? 9.99 : 0;
  const tax           = parseFloat((afterDiscount * 0.08).toFixed(2));
  const totalUSD      = parseFloat((afterDiscount + shipping + tax).toFixed(2));
  const totalETB      = parseFloat((totalUSD * etbRate).toFixed(2));

  const isEthiopian   = CHAPA_METHODS.includes(pm);

  const handleCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const { data } = await api.post('/coupons/validate', { code: couponCode, orderTotal: cartTotal });
      setCouponResult(data);
      toast.success(`Coupon applied! You save $${data.discount.toFixed(2)}`);
    } catch (err) {
      toast.error(err.response?.data?.message || 'Invalid coupon');
      setCouponResult(null);
    } finally { setCouponLoading(false); }
  };

  const handlePlaceOrder = async () => {
    setLoading(true);
    try {
      // 1. Create the order in DB
      const { data: order } = await api.post('/orders', {
        shippingAddress: addr,
        paymentMethod:   pm,
        couponCode:      couponResult ? couponCode : '',
        notes:           '',
      });

      // 2a. Cash on Delivery
      if (pm === 'cod') {
        toast.success('Order placed! Pay cash on delivery.');
        navigate(`/order-success/${order.id}`);
        return;
      }

      // 2b. Chapa-based payment (Telebirr, CBEBirr, M-Pesa, Amole, or card)
      setRedirecting(true);
      const { data: chapaData } = await api.post('/payment/chapa/initiate', { orderId: order.id });

      if (chapaData.checkoutUrl) {
        toast.success('Redirecting to payment…');
        // Hard redirect to Chapa hosted payment page
        window.location.href = chapaData.checkoutUrl;
      } else {
        toast.error('Could not get Chapa checkout URL. Please try again.');
        setRedirecting(false);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to place order');
      setRedirecting(false);
    } finally { setLoading(false); }
  };

  if (!cart.items?.length) { navigate('/cart'); return null; }

  const selectedMethod = PAYMENT_METHODS.find(m => m.id === pm);

  return (
    <div className="max-w-4xl mx-auto px-4 py-6">

      {/* Redirect overlay */}
      {redirecting && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center">
          <div className="bg-white dark:bg-dk-card rounded-2xl p-8 text-center max-w-sm mx-4 shadow-2xl">
            <div className="text-5xl mb-4">🇪🇹</div>
            <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin mx-auto mb-4" />
            <h3 className="font-bold text-lg text-az-text dark:text-dk-text mb-2">Redirecting to Chapa</h3>
            <p className="text-az-muted dark:text-dk-muted text-sm">
              You'll be taken to Chapa's secure page to complete payment with{' '}
              <strong>{selectedMethod?.label}</strong>.
            </p>
            <p className="text-xs text-az-muted dark:text-dk-muted mt-2">Do not close this window.</p>
          </div>
        </div>
      )}

      {/* Step indicators */}
      <div className="flex items-center mb-8">
        {STEPS.map((s, i) => (
          <div key={s} className="flex items-center flex-1">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-az-orange' : 'text-az-muted dark:text-dk-muted'}`}>
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors
                ${i < step  ? 'bg-az-orange border-az-orange text-white'
                : i === step ? 'border-az-orange text-az-orange'
                :              'border-az-border dark:border-dk-border'}`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="font-medium text-sm hidden sm:block">{s}</span>
            </div>
            {i < STEPS.length - 1 && (
              <div className={`flex-1 h-0.5 mx-3 ${i < step ? 'bg-az-orange' : 'bg-az-border dark:bg-dk-border'}`} />
            )}
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-[1fr_300px] gap-5">
        <div>

          {/* ── Step 0: Shipping ─────────────────────────────────────── */}
          {step === 0 && (
            <form onSubmit={e => { e.preventDefault(); setStep(1); }} className="card p-6">
              <h2 className="section-title">Shipping Address</h2>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  ['fullName',    'Full Name (ሙሉ ስም)',     'text'],
                  ['phone',       'Phone / ስልክ (+251…)',    'tel'],
                  ['address',     'Street Address / ቀበሌ',  'text'],
                  ['city',        'City / ከተማ',             'text'],
                  ['postalCode',  'Postal Code',            'text'],
                  ['country',     'Country',                'text'],
                ].map(([k, l, t]) => (
                  <div key={k} className={k === 'address' ? 'sm:col-span-2' : ''}>
                    <label className="label">{l}</label>
                    <input
                      type={t} required value={addr[k]}
                      onChange={e => setAddr(a => ({ ...a, [k]: e.target.value }))}
                      className="input" placeholder={l}
                    />
                  </div>
                ))}
              </div>
              <button type="submit" className="btn-primary mt-5">Continue to Payment →</button>
            </form>
          )}

          {/* ── Step 1: Payment ──────────────────────────────────────── */}
          {step === 1 && (
            <div className="card p-6">
              <h2 className="section-title">Payment Method — የክፍያ ዘዴ</h2>

              {/* Ethiopian payment methods */}
              <div className="mb-3">
                <p className="text-xs font-semibold text-az-muted dark:text-dk-muted uppercase tracking-wide mb-2">
                  🇪🇹 Ethiopian Payment Options
                </p>
                <div className="space-y-2">
                  {PAYMENT_METHODS.filter(m => m.id !== 'cod').map(m => (
                    <label
                      key={m.id}
                      className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                        ${pm === m.id
                          ? `${m.color} dark:border-opacity-70`
                          : 'border-az-border dark:border-dk-border hover:border-az-orange/40'}`}
                    >
                      <input
                        type="radio" name="pay" value={m.id}
                        checked={pm === m.id}
                        onChange={() => setPm(m.id)}
                        className="accent-orange-500 w-4 h-4 shrink-0"
                      />
                      <span className="text-xl w-6 text-center">{m.icon}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-bold text-az-text dark:text-dk-text text-sm">{m.label}</p>
                          {m.badge && (
                            <span className={`text-xs text-white px-2 py-0.5 rounded-full ${m.badgeColor}`}>
                              {m.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-az-muted dark:text-dk-muted text-xs mt-0.5">{m.sub}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* COD */}
              <div className="mb-4">
                <p className="text-xs font-semibold text-az-muted dark:text-dk-muted uppercase tracking-wide mb-2">
                  Other
                </p>
                {PAYMENT_METHODS.filter(m => m.id === 'cod').map(m => (
                  <label
                    key={m.id}
                    className={`flex items-center gap-3 p-3 border-2 rounded-lg cursor-pointer transition-all
                      ${pm === m.id
                        ? 'border-gray-500 bg-gray-50 dark:bg-gray-800'
                        : 'border-az-border dark:border-dk-border hover:border-gray-400'}`}
                  >
                    <input
                      type="radio" name="pay" value={m.id}
                      checked={pm === m.id} onChange={() => setPm(m.id)}
                      className="accent-orange-500 w-4 h-4 shrink-0"
                    />
                    <span className="text-xl w-6 text-center">{m.icon}</span>
                    <div>
                      <p className="font-bold text-az-text dark:text-dk-text text-sm">{m.label}</p>
                      <p className="text-az-muted dark:text-dk-muted text-xs">{m.sub}</p>
                    </div>
                  </label>
                ))}
              </div>

              {/* Info banner */}
              {isEthiopian && (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4 mb-4">
                  <p className="text-green-800 dark:text-green-300 font-bold text-sm mb-1">
                    🔒 Secure Payment via Chapa
                  </p>
                  <p className="text-green-700 dark:text-green-400 text-xs mb-2">
                    You'll be redirected to Chapa's secure payment page. Chapa supports Telebirr,
                    CBEBirr, M-Pesa, Amole, and international cards.
                  </p>
                  <p className="text-green-700 dark:text-green-400 text-xs">
                    Amount: <strong>{totalETB.toLocaleString()} ETB</strong>{' '}
                    <span className="opacity-70">(≈ ${totalUSD.toFixed(2)} USD @ {etbRate} ETB/USD)</span>
                  </p>
                </div>
              )}

              {pm === 'cod' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 dark:text-yellow-300 text-sm">
                    💵 Cash will be collected on delivery. Our admin verifies and marks your order as paid.
                  </p>
                </div>
              )}

              {/* Coupon */}
              <div className="border-t border-az-border dark:border-dk-border pt-4 mb-4">
                <label className="label">
                  Coupon Code <span className="font-normal text-az-muted dark:text-dk-muted">(optional)</span>
                </label>
                <div className="flex gap-2">
                  <input
                    value={couponCode}
                    onChange={e => setCouponCode(e.target.value.toUpperCase())}
                    className="input" placeholder="e.g. WELCOME10"
                  />
                  <button
                    type="button" onClick={handleCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="btn-secondary shrink-0 px-5 disabled:opacity-50"
                  >
                    {couponLoading ? '…' : 'Apply'}
                  </button>
                </div>
                {couponResult && (
                  <div className="mt-2 text-sm text-green-700 dark:text-green-300 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded px-3 py-2">
                    ✓ <strong>{couponResult.coupon.code}</strong> applied — you save{' '}
                    <strong>${couponResult.discount.toFixed(2)}</strong>!
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(0)} className="btn-secondary">← Back</button>
                <button onClick={() => setStep(2)} className="btn-primary">Review Order →</button>
              </div>
            </div>
          )}

          {/* ── Step 2: Review ───────────────────────────────────────── */}
          {step === 2 && (
            <div className="card p-6">
              <h2 className="section-title">Review Your Order</h2>

              {/* Shipping summary */}
              <div className="bg-az-bg dark:bg-dk-nav rounded-lg p-4 mb-3">
                <div className="flex justify-between mb-1">
                  <p className="font-bold text-sm text-az-text dark:text-dk-text">Shipping to</p>
                  <button onClick={() => setStep(0)} className="link text-xs">Change</button>
                </div>
                <p className="text-sm text-az-text dark:text-dk-text">{addr.fullName} · {addr.phone}</p>
                <p className="text-xs text-az-muted dark:text-dk-muted">
                  {addr.address}, {addr.city}, {addr.postalCode}, {addr.country}
                </p>
              </div>

              {/* Payment summary */}
              <div className="bg-az-bg dark:bg-dk-nav rounded-lg p-4 mb-4">
                <div className="flex justify-between mb-1">
                  <p className="font-bold text-sm text-az-text dark:text-dk-text">Payment</p>
                  <button onClick={() => setStep(1)} className="link text-xs">Change</button>
                </div>
                <p className="text-sm text-az-text dark:text-dk-text">{selectedMethod?.label}</p>
                {isEthiopian && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    🔒 You'll be redirected to Chapa to pay securely
                  </p>
                )}
                {couponResult && (
                  <p className="text-xs text-green-600 dark:text-green-400 mt-1">
                    🎫 Coupon <strong>{couponCode}</strong> applied
                  </p>
                )}
              </div>

              {/* Items */}
              <div className="space-y-2 mb-5">
                {cart.items.map(i => (
                  <div key={i.id} className="flex items-center gap-3">
                    <img
                      src={i.product?.image} alt=""
                      className="w-12 h-12 object-contain bg-white dark:bg-dk-nav rounded border border-az-border dark:border-dk-border p-1"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-az-text dark:text-dk-text line-clamp-1">{i.product?.name}</p>
                      <p className="text-xs text-az-muted dark:text-dk-muted">Qty: {i.quantity}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-sm text-az-text dark:text-dk-text">
                        ${(Number(i.product?.price || 0) * i.quantity).toFixed(2)}
                      </p>
                      {isEthiopian && (
                        <p className="text-xs text-az-muted dark:text-dk-muted">
                          {(Number(i.product?.price || 0) * i.quantity * etbRate).toLocaleString()} ETB
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setStep(1)} className="btn-secondary">← Back</button>
                <button
                  onClick={handlePlaceOrder}
                  disabled={loading || redirecting}
                  className="btn-orange flex-1 flex items-center justify-center gap-2"
                >
                  {loading || redirecting
                    ? (<><span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Processing…</>)
                    : isEthiopian
                      ? `Pay ${totalETB.toLocaleString()} ETB →`
                      : `Place Order · $${totalUSD.toFixed(2)} →`
                  }
                </button>
              </div>

              <p className="text-xs text-az-muted dark:text-dk-muted text-center mt-3">
                {isEthiopian
                  ? '🔒 Secured by Chapa — ቻፓ ያረጋግጣል'
                  : '💵 Cash on Delivery — pay when it arrives'}
              </p>
            </div>
          )}
        </div>

        {/* ── Order Summary Sidebar ───────────────────────────────────── */}
        <div className="card p-4 h-fit sticky top-32">
          <h3 className="font-bold text-az-text dark:text-dk-text mb-4 pb-3 border-b border-az-border dark:border-dk-border text-sm">
            Order Summary
          </h3>
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-az-muted dark:text-dk-muted">Items:</span>
              <span className="text-az-text dark:text-dk-text">${cartTotal.toFixed(2)}</span>
            </div>
            {discount > 0 && (
              <div className="flex justify-between">
                <span className="text-az-muted dark:text-dk-muted">Discount:</span>
                <span className="text-az-green dark:text-dk-green font-medium">-${discount.toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between">
              <span className="text-az-muted dark:text-dk-muted">Shipping:</span>
              <span className={shipping === 0 ? 'text-az-green dark:text-dk-green font-medium' : 'text-az-text dark:text-dk-text'}>
                {shipping === 0 ? 'FREE' : `$${shipping.toFixed(2)}`}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-az-muted dark:text-dk-muted">Tax (8%):</span>
              <span className="text-az-text dark:text-dk-text">${tax.toFixed(2)}</span>
            </div>
            <div className="flex justify-between font-bold text-base border-t border-az-border dark:border-dk-border pt-2">
              <span>Total:</span>
              <div className="text-right">
                <p className="price">${totalUSD.toFixed(2)}</p>
                {isEthiopian && (
                  <p className="text-xs text-green-600 dark:text-green-400 font-semibold">
                    {totalETB.toLocaleString()} ETB
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Chapa accepted methods */}
          {isEthiopian && (
            <div className="mt-4 pt-3 border-t border-az-border dark:border-dk-border">
              <p className="text-xs font-semibold text-az-muted dark:text-dk-muted mb-2">Accepted via Chapa:</p>
              <div className="grid grid-cols-2 gap-1 text-xs text-az-muted dark:text-dk-muted">
                <span>📱 Telebirr</span>
                <span>🏦 CBEBirr</span>
                <span>🟢 M-Pesa</span>
                <span>⚡ Amole</span>
                <span className="col-span-2">💳 Visa / Mastercard</span>
              </div>
            </div>
          )}

          <div className="mt-4 space-y-1 text-xs text-az-muted dark:text-dk-muted">
            <p>🔒 SSL secured</p>
            <p>✉️ Email confirmation</p>
            <p>↩️ 30-day returns</p>
            {isEthiopian && <p>🇪🇹 Ethiopian payment supported</p>}
          </div>
        </div>
      </div>
    </div>
  );
}
