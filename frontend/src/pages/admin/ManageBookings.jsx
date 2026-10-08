import { useCallback, useEffect, useState } from 'react';
import { cancelAdminBooking, getAdminBookings, getAdminCustomers, returnAdminBooking } from '../../services/adminService';
import useAutoRefresh from '../../hooks/useAutoRefresh';
import { fetchVehicles } from '../../services/vehicleService';

const dateToday = () => {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
};

export default function ManageBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const loadBookings = useCallback(async () => {
    setError('');
    try {
      const [bookingResponse, customerResponse, vehicleResponse] = await Promise.all([
        getAdminBookings(),
        getAdminCustomers(),
        fetchVehicles()
      ]);
      const customerById = new Map((customerResponse.data?.data || []).map((customer) => [customer.customerId, customer]));
      const vehicleById = new Map((vehicleResponse.data?.data || []).map((vehicle) => [vehicle.vehicleId, vehicle]));
      setBookings((bookingResponse.data?.data || []).map((booking) => {
        const customer = customerById.get(booking.customerId);
        const vehicle = vehicleById.get(booking.vehicleId);
        return {
          ...booking,
          customerName: customer?.name || `Customer #${booking.customerId}`,
          vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : `Vehicle #${booking.vehicleId}`
        };
      }));
      setLastUpdated(new Date());
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load bookings.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);
  useAutoRefresh(loadBookings);

  const performAction = async (booking, action) => {
    const description = action === 'cancel' ? 'cancel this booking' : 'mark this vehicle as returned';
    if (!window.confirm(`Are you sure you want to ${description} for booking #${booking.bookingId}?`)) return;
    setActionId(booking.bookingId);
    setError('');
    setNotice('');
    try {
      const response = action === 'cancel'
        ? await cancelAdminBooking(booking.bookingId)
        : await returnAdminBooking(booking.bookingId);
      setNotice(response.data?.message || 'Booking updated.');
      await loadBookings();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to update this booking.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">Manage Bookings</h1>
        <span className="text-xs text-slate-500">Live data{lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ''}</span>
      </div>
      {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}
      {notice && <p role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</p>}
      <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Booking ID</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Customer</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vehicle</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Dates</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">Loading bookings...</td></tr>
            ) : bookings.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">No bookings have been made yet.</td></tr>
            ) : bookings.map((booking) => {
              const canCancel = ['PENDING_PAYMENT', 'CONFIRMED'].includes(booking.bookingStatus) && booking.startDate > dateToday();
              const canReturn = ['ACTIVE', 'CONFIRMED'].includes(booking.bookingStatus);
              return (
                <tr key={booking.bookingId}>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">#{booking.bookingId}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{booking.customerName}</td>
                  <td className="px-4 py-3 text-sm text-slate-700">{booking.vehicleName}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{booking.startDate} → {booking.endDate}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">₹{Number(booking.totalAmount).toLocaleString('en-IN')}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{booking.bookingStatus}</td>
                  <td className="px-4 py-3 text-sm">
                    <div className="flex gap-2">
                      {canCancel && (
                        <button type="button" className="button-secondary text-xs text-red-600 disabled:opacity-50" disabled={actionId === booking.bookingId} onClick={() => performAction(booking, 'cancel')}>
                          Cancel
                        </button>
                      )}
                      {canReturn && (
                        <button type="button" className="button-primary text-xs disabled:opacity-50" disabled={actionId === booking.bookingId} onClick={() => performAction(booking, 'return')}>
                          {actionId === booking.bookingId ? 'Working...' : 'Mark Returned'}
                        </button>
                      )}
                      {!canCancel && !canReturn && <span className="text-xs text-slate-400">—</span>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
