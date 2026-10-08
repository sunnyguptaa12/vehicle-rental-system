import { useEffect, useState } from 'react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { getBookingById } from '../services/bookingService';
import { createPayment } from '../services/paymentService';

export default function Payment() {
  const navigate = useNavigate();
  const location = useLocation();
  const { bookingId, paymentMethod } = location.state || {};
  const [booking, setBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [card, setCard] = useState({
    cardNumber: '',
    expiry: '',
    cvv: '',
    holder: ''
  });

  useEffect(() => {
    if (!bookingId) return undefined;
    let active = true;
    getBookingById(bookingId)
      .then((response) => {
        if (active) setBooking(response.data?.data || response.data);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.response?.data?.message || 'Unable to load booking total');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (!bookingId) {
    return <Navigate to="/vehicles" replace />;
  }

  const totalAmount = Number(booking?.totalAmount) || 0;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!booking || totalAmount <= 0) {
      setError('The booking total is unavailable. Please select dates and create the booking again.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createPayment({
        bookingId,
        paymentMethod: paymentMethod || 'UPI'
      });
      const paidAmount = Number(response.data?.data?.amount) || totalAmount;
      navigate('/booking-success', { state: { bookingId, totalAmount: paidAmount } });
    } catch (paymentError) {
      setError(paymentError.response?.data?.message || 'Payment failed');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="card p-8">
        <h1 className="text-3xl font-bold text-slate-900">Simulated Payment</h1>
        <p className="mt-2 text-slate-500">No real card data is stored. This is a demo payment flow.</p>
        {error && <div role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}

        {loading ? (
          <p className="mt-8 text-slate-600">Loading booking total...</p>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Payment method</label>
              <input className="w-full rounded-xl border border-slate-300 px-3 py-2.5" value={paymentMethod || 'UPI'} readOnly />
            </div>

            {paymentMethod === 'CARD' && (
              <>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Card number</label>
                  <input value={card.cardNumber} onChange={(event) => setCard({ ...card, cardNumber: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="4242 4242 4242 4242" required />
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">Expiry</label>
                    <input value={card.expiry} onChange={(event) => setCard({ ...card, expiry: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="MM/YY" required />
                  </div>
                  <div>
                    <label className="mb-1 block text-sm font-medium text-slate-700">CVV</label>
                    <input value={card.cvv} onChange={(event) => setCard({ ...card, cvv: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" placeholder="123" required />
                  </div>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-slate-700">Cardholder name</label>
                  <input value={card.holder} onChange={(event) => setCard({ ...card, holder: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5" required />
                </div>
              </>
            )}

            <div className="rounded-xl bg-slate-100 p-4 text-sm text-slate-700">
              Booking #{bookingId} total: <strong>₹{totalAmount}</strong>
            </div>

            <button type="submit" className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-50" disabled={submitting || totalAmount <= 0}>
              {submitting ? 'Processing payment...' : 'Pay and Confirm'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
