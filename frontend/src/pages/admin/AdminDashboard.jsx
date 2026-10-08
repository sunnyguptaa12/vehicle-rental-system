import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import useAdminDashboardEvents from '../../hooks/useAdminDashboardEvents';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { getDashboard } from '../../services/adminService';

const currencyFormatter = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0
});

function RevenueChart({ data }) {
  const values = data.map((point) => Number(point.revenue) || 0);
  const maxValue = Math.max(...values, 1);
  const chartPoints = data.map((point, index) => ({
    ...point,
    x: data.length < 2 ? 300 : 40 + (index * 520) / (data.length - 1),
    y: 150 - ((Number(point.revenue) || 0) / maxValue) * 115
  }));

  return (
    <svg role="img" aria-label="Revenue for the last six months" viewBox="0 0 600 200" className="mt-5 h-56 w-full">
      <title>Revenue for the last six months</title>
      {[35, 92, 150].map((y) => (
        <line key={y} x1="40" x2="560" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 5" />
      ))}
      {chartPoints.length > 1 && (
        <polyline
          fill="none"
          stroke="#f97316"
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth="4"
          points={chartPoints.map((point) => `${point.x},${point.y}`).join(' ')}
        />
      )}
      {chartPoints.map((point) => (
        <g key={`${point.year}-${point.month}`}>
          <circle cx={point.x} cy={point.y} r="5" fill="#f97316">
            <title>{`${point.month} ${point.year}: ${currencyFormatter.format(Number(point.revenue) || 0)}`}</title>
          </circle>
          <text x={point.x} y="185" textAnchor="middle" className="fill-slate-500 text-[12px]">
            {point.month}
          </text>
        </g>
      ))}
      {values.every((value) => value === 0) && (
        <text x="300" y="95" textAnchor="middle" className="fill-slate-500 text-sm">No successful payments in this period</text>
      )}
    </svg>
  );
}

function BookingChart({ data }) {
  const values = data.map((point) => Number(point.bookings) || 0);
  const maxValue = Math.max(...values, 1);
  const barWidth = data.length ? Math.min(48, 360 / data.length) : 48;
  const slotWidth = data.length ? 520 / data.length : 520;

  return (
    <svg role="img" aria-label="Bookings created in the last six months" viewBox="0 0 600 200" className="mt-5 h-56 w-full">
      <title>Bookings created in the last six months</title>
      {[35, 92, 150].map((y) => (
        <line key={y} x1="40" x2="560" y1={y} y2={y} stroke="#e2e8f0" strokeDasharray="4 5" />
      ))}
      {data.map((point, index) => {
        const value = Number(point.bookings) || 0;
        const height = (value / maxValue) * 115;
        const x = 40 + slotWidth * index + (slotWidth - barWidth) / 2;
        const y = 150 - height;
        return (
          <g key={`${point.year}-${point.month}`}>
            <rect x={x} y={y} width={barWidth} height={Math.max(height, 2)} rx="6" fill="#0284c7">
              <title>{`${point.month} ${point.year}: ${value} bookings`}</title>
            </rect>
            <text x={x + barWidth / 2} y="185" textAnchor="middle" className="fill-slate-500 text-[12px]">
              {point.month}
            </text>
          </g>
        );
      })}
      {values.every((value) => value === 0) && (
        <text x="300" y="95" textAnchor="middle" className="fill-slate-500 text-sm">No bookings in this period</text>
      )}
    </svg>
  );
}

export default function AdminDashboard() {
  const { token, role } = useAuth();
  const [dashboard, setDashboard] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadDashboard = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await getDashboard();
      setDashboard(response.data?.data || response.data);
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);
  const liveConnection = useAdminDashboardEvents(loadDashboard, token, role);
  useAutoRefresh(loadDashboard);

  const stats = dashboard ? [
    { label: 'Total Vehicles', value: dashboard.totalVehicles },
    { label: 'Available', value: dashboard.availableVehicles },
    { label: 'Rented', value: dashboard.rentedVehicles },
    { label: 'Maintenance', value: dashboard.maintenanceVehicles },
    { label: 'Customers', value: dashboard.totalCustomers, to: '/admin/customers' },
    { label: 'Bookings', value: dashboard.totalBookings, to: '/admin/bookings' },
    { label: 'Revenue', value: currencyFormatter.format(Number(dashboard.totalRevenue) || 0), to: '/admin/revenue' }
  ] : [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Operations</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Admin Dashboard</h1>
        </div>
        <div className="flex flex-col items-end gap-2">
          <span role="status" className="text-xs text-slate-500">
            {liveConnection === 'connected' ? 'Live updates connected' : 'Live updates reconnecting'}
            {lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ' · Backup refresh every 5 seconds'}
          </span>
          <Link to="/admin/vehicles/add" className="button-primary">Add Vehicle</Link>
        </div>
      </div>

      {error && (
        <div role="alert" className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={loadDashboard} className="font-semibold underline">Retry</button>
        </div>
      )}

      {loading && !dashboard ? (
        <p role="status" className="py-12 text-center text-slate-500">Loading dashboard...</p>
      ) : dashboard && (
        <>
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
            {stats.map((stat) => {
              const card = (
                <div className="card h-full p-5">
                  <p className="text-sm text-slate-500">{stat.label}</p>
                  <h3 className="mt-3 text-3xl font-black text-slate-900">{stat.value}</h3>
                </div>
              );
              return stat.to ? (
                <Link key={stat.label} to={stat.to} className="block rounded-2xl focus:outline-none focus:ring-2 focus:ring-orange-500">
                  {card}
                </Link>
              ) : <div key={stat.label}>{card}</div>;
            })}
          </div>

          <div className="mt-10 grid gap-6 lg:grid-cols-2">
            <section className="card p-6">
              <h2 className="text-xl font-bold text-slate-900">Revenue Overview</h2>
              <p className="mt-1 text-sm text-slate-500">Successful payments over the last six months</p>
              <RevenueChart data={dashboard.revenueTrend || []} />
            </section>
            <section className="card p-6">
              <h2 className="text-xl font-bold text-slate-900">Booking Activity</h2>
              <p className="mt-1 text-sm text-slate-500">Bookings created over the last six months</p>
              <BookingChart data={dashboard.bookingTrend || []} />
            </section>
          </div>
        </>
      )}
    </div>
  );
}
