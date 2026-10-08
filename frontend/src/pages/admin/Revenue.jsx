import { useCallback, useEffect, useState } from 'react';
import { getDashboard } from '../../services/adminService';
import useAutoRefresh from '../../hooks/useAutoRefresh';

const money = (value) => `₹${Number(value || 0).toLocaleString('en-IN', { maximumFractionDigits: 0 })}`;

export default function Revenue() {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadRevenue = useCallback(async () => {
    setError('');
    try {
      const response = await getDashboard();
      setDashboard(response.data?.data || response.data);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load revenue data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadRevenue();
  }, [loadRevenue]);
  useAutoRefresh(loadRevenue);

  const revenueTrend = dashboard?.revenueTrend || [];
  const currentMonth = revenueTrend[revenueTrend.length - 1];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Revenue Overview</h1>
        <span className="text-xs text-slate-500">Live data{lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ''}</span>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {loading && !dashboard ? (
        <p role="status" className="mt-8 text-slate-500">Loading revenue...</p>
      ) : dashboard && (
        <>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            <div className="card p-6">
              <p className="text-sm text-slate-500">Successful Revenue</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">{money(dashboard.totalRevenue)}</h2>
            </div>
            <div className="card p-6">
              <p className="text-sm text-slate-500">This Month</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">{money(currentMonth?.revenue)}</h2>
            </div>
            <div className="card p-6">
              <p className="text-sm text-slate-500">Total Bookings</p>
              <h2 className="mt-3 text-3xl font-black text-slate-900">{dashboard.totalBookings}</h2>
            </div>
          </div>
          <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Month</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Successful Revenue</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Bookings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {revenueTrend.map((month, index) => (
                  <tr key={`${month.year}-${month.month}`}>
                    <td className="px-4 py-3 text-sm text-slate-700">{month.month} {month.year}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{money(month.revenue)}</td>
                    <td className="px-4 py-3 text-sm text-slate-700">{dashboard.bookingTrend?.[index]?.bookings || 0}</td>
                  </tr>
                ))}
                {revenueTrend.length === 0 && (
                  <tr><td colSpan="3" className="px-4 py-8 text-center text-sm text-slate-500">No revenue data is available yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
