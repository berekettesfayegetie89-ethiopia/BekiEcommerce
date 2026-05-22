import { useEffect, useState } from 'react';
import { useParams, useSearchParams, Link } from 'react-router-dom';
import api from '../api/axios';
import toast from 'react-hot-toast';

export default function OrderSuccess() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const txRef = searchParams.get('tx_ref');   // Chapa appends this on redirect

  const [order, setOrder]     = useState(null);
  const [loading, setLoading] = useState(true);
  const [verifying, setVerifying] = useState(false);
  const [payStatus, setPayStatus] = useState(null); // 'verified' | 'pending' | 'failed'

  useEffect(() => {
    const run = async () => {
      try {
        // If Chapa redirected back with tx_ref, verify it
        if (txRef) {
          setVerifying(true);
          try {
            const { data } = await api.get(`/payment/chapa/verify/${txRef}`);
            setOrder(data.order);
            setPayStatus('verified');
            toast.success('Payment confirmed! ✓');
          } catch (err) {
            // Webhook may have already updated it — try loading the order anyway
            const msg = err.response?.data?.chapaStatus || err.response?.data?.message || '';
            if (msg === 'pending') {
              setPayStatus('pending');
              toast('Payment is being processed…', { icon: '⏳' });
            } else {
              setPayStatus('failed');
              toast.error('Payment verification failed: ' + (err.response?.data?.message || 'unknown error'));
            }
            // Still load the order
            const { data: orderData } = await api.get(`/orders/${id}`);
            setOrder(orderData);
          } finally { setVerifying(false); }
        } else {
          // COD or already-verified path
          const { data } = await api.get(`/orders/${id}`);
          setOrder(data);
          setPayStatus(data.isPaid ? 'verified' : 'pending');
        }
      } catch (err) {
        toast.error('Could not load order');
      } finally { setLoading(false); }
    };
    run();
  }, [id, txRef]);

  if (loading || verifying) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
        <div className="w-12 h-12 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-az-muted dark:text-dk-muted text-sm">
          {verifying ? 'Verifying your payment…' : 'Loading order…'}
        </p>
      </div>
    );
  }

  const isEthiopian = ['chapa','telebirr','cbebirr','mpesa','amole'].includes(order?.paymentMethod);

  return (
    <div className="max-w-lg mx-auto px-4 py-16 text-center">
      {/* Icon */}
      <div className="text-7xl mb-4">
        {payStatus === 'verified' ? '✅' : payStatus === 'pending' ? '⏳' : '❌'}
      </div>

      {/* Heading */}
      <h1 className="text-2xl font-bold text-az-text dark:text-dk-text mb-2">
        {payStatus === 'verified'
          ? 'Order Confirmed!'
          : payStatus === 'pending'
            ? 'Payment Processing…'
            : 'Payment Issue'}
      </h1>

      <p className="text-az-muted dark:text-dk-muted text-sm mb-6">
        {payStatus === 'verified' && 'Your order has been placed and payment confirmed. We\'ll email you a confirmation.'}
        {payStatus === 'pending'  && 'Your payment is being processed. This usually takes a few minutes. We\'ll email you when confirmed.'}
        {payStatus === 'failed'   && 'There was an issue verifying your payment. Please contact support with your order ID.'}
      </p>

      {order && (
        <div className="card p-5 text-left mb-6 space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-az-muted dark:text-dk-muted">Order ID</span>
            <span className="font-mono text-az-text dark:text-dk-text font-bold">#{order.id.slice(0,8).toUpperCase()}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-az-muted dark:text-dk-muted">Payment</span>
            <span className="text-az-text dark:text-dk-text capitalize">
              {order.paymentMethod === 'cod' ? 'Cash on Delivery'
               : order.paymentMethod === 'chapa' ? 'Chapa (Ethiopian Payments)'
               : order.paymentMethod.toUpperCase()}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-az-muted dark:text-dk-muted">Amount</span>
            <div className="text-right">
              <span className="font-bold text-az-text dark:text-dk-text">${Number(order.totalPrice).toFixed(2)}</span>
              {isEthiopian && order.totalPriceETB && (
                <p className="text-xs text-green-600 dark:text-green-400">
                  {Number(order.totalPriceETB).toLocaleString()} ETB
                </p>
              )}
            </div>
          </div>
          <div className="flex justify-between">
            <span className="text-az-muted dark:text-dk-muted">Status</span>
            <span className={`font-semibold capitalize ${
              order.isPaid ? 'text-green-600 dark:text-green-400'
              : 'text-yellow-600 dark:text-yellow-400'
            }`}>
              {order.isPaid ? '✓ Paid' : '⏳ Pending Payment'}
            </span>
          </div>
        </div>
      )}

      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Link to={`/orders/${id}`} className="btn-primary">View Order Details</Link>
        <Link to="/" className="btn-secondary">Continue Shopping</Link>
      </div>
    </div>
  );
}
