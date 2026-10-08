import { useCallback, useEffect, useState } from 'react';
import { getAllPayments } from '../../services/paymentService';
import useAutoRefresh from '../../hooks/useAutoRefresh';

export default function ManagePayments() {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadPayments = useCallback(async () => {
    setError('');
    try {
      const response = await getAllPayments();
      setPayments(response.data?.data || []);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load payments.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPayments();
  }, [loadPayments]);
  useAutoRefresh(loadPayments);

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Manage Payments</h1>
        <span className="text-xs text-slate-500">Live data{lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ''}</span>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Payment ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Booking</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Method</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">Loading payments...</td></tr>
            ) : payments.length === 0 ? (
              <tr><td colSpan="6" className="px-4 py-8 text-center text-sm text-slate-500">No payments have been made yet.</td></tr>
            ) : payments.map((payment) => (
              <tr key={payment.paymentId}>
                <td className="px-4 py-3 text-sm text-slate-700">#{payment.paymentId}</td>
                <td className="px-4 py-3 text-sm text-slate-700">#{payment.bookingId}</td>
                <td className="px-4 py-3 text-sm text-slate-700">₹{Number(payment.amount).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{payment.paymentMethod}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{payment.paymentStatus}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{payment.paymentDate}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
