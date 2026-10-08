import { useCallback, useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import useAutoRefresh from '../hooks/useAutoRefresh';
import { cancelBooking, getCustomerBookings, returnVehicle } from '../services/bookingService';
import { fetchVehicles } from '../services/vehicleService';

function todayString() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

export default function MyBookings() {
  const { user } = useAuth();
  const location = useLocation();
  const [bookings, setBookings] = useState([]);
  const [selectedBooking, setSelectedBooking] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionId, setActionId] = useState(null);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);
  const focusBookingHandled = useRef(false);

  const loadBookings = useCallback(async () => {
    if (!user?.customerId) {
      setBookings([]);
      setLoading(false);
      setError('Please log in with a customer account to view bookings.');
      return;
    }

    setError('');
    try {
      const [bookingResponse, vehicleResponse] = await Promise.all([
        getCustomerBookings(user.customerId),
        fetchVehicles()
      ]);
      const bookingList = bookingResponse.data?.data || [];
      const vehicleList = vehicleResponse.data?.data || [];
      const vehicleById = new Map(vehicleList.map((vehicle) => [vehicle.vehicleId, vehicle]));
      const hydratedBookings = bookingList.map((booking) => {
        const vehicle = vehicleById.get(booking.vehicleId);
        return {
          ...booking,
          vehicleName: vehicle ? `${vehicle.brand} ${vehicle.model}` : `Vehicle #${booking.vehicleId}`
        };
      });
      setBookings(hydratedBookings);
      setLastUpdated(new Date());
      setSelectedBooking((current) => current
        ? hydratedBookings.find((booking) => booking.bookingId === current.bookingId) || null
        : current);

      const focusBookingId = Number(location.state?.focusBookingId);
      if (focusBookingId && !focusBookingHandled.current) {
        focusBookingHandled.current = true;
        setSelectedBooking(hydratedBookings.find((booking) => booking.bookingId === focusBookingId) || null);
      }
    } catch (loadError) {
      setError(loadError.response?.data?.message || 'Unable to load your bookings. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [user?.customerId, location.state]);

  useEffect(() => {
    loadBookings();
  }, [loadBookings]);
  useAutoRefresh(loadBookings);

  const handleCancel = async (booking) => {
    if (!window.confirm(`Cancel booking #${booking.bookingId} for ${booking.vehicleName}?`)) return;
    setActionId(booking.bookingId);
    setError('');
    setNotice('');
    try {
      const response = await cancelBooking(booking.bookingId, { customerId: user.customerId });
      setNotice(response.data?.message || 'Booking cancelled.');
      await loadBookings();
      setSelectedBooking((current) => current?.bookingId === booking.bookingId
        ? { ...current, bookingStatus: 'CANCELLED' }
        : current);
    } catch (actionError) {
      setError(actionError.response?.data?.message || 'Unable to cancel this booking.');
    } finally {
      setActionId(null);
    }
  };

  const handleReturn = async (booking) => {
    if (!window.confirm(`Mark ${booking.vehicleName} as returned for booking #${booking.bookingId}?`)) return;
    setActionId(booking.bookingId);
    setError('');
    setNotice('');
    try {
      const response = await returnVehicle(booking.bookingId, { customerId: user.customerId });
      setNotice(response.data?.message || 'Vehicle returned successfully.');
      await loadBookings();
      setSelectedBooking((current) => current?.bookingId === booking.bookingId
        ? { ...current, bookingStatus: 'COMPLETED' }
        : current);
    } catch (actionError) {
      setError(actionError.response?.data?.message || 'Unable to return this vehicle.');
    } finally {
      setActionId(null);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <h1 className="text-3xl font-bold text-slate-900">My Bookings</h1>
        <span role="status" className="text-xs text-slate-500">
          Live updates every 5 seconds{lastUpdated ? ` · Updated ${lastUpdated.toLocaleTimeString()}` : ''}
        </span>
      </div>
      {error && <div role="alert" className="mt-5 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="mt-5 rounded-lg bg-green-50 px-4 py-3 text-sm text-green-700">{notice}</div>}

      {loading ? (
        <p className="mt-8 text-slate-600">Loading your bookings...</p>
      ) : bookings.length === 0 ? (
        <div className="card mt-8 p-8 text-center text-slate-600">You do not have any bookings yet.</div>
      ) : (
        <div className="mt-8 overflow-x-auto rounded-2xl border border-slate-200 bg-white shadow-sm">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Booking ID</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Vehicle</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Dates</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Amount</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
                <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {bookings.map((booking) => {
                const canCancel = ['PENDING_PAYMENT', 'CONFIRMED'].includes(booking.bookingStatus)
                  && booking.startDate > todayString();
                const canReturn = ['ACTIVE', 'CONFIRMED'].includes(booking.bookingStatus);
                return (
                  <tr key={booking.bookingId} className="border-t border-slate-200">
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">#{booking.bookingId}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{booking.vehicleName}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">{booking.startDate} → {booking.endDate}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-700">₹{booking.totalAmount}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${booking.bookingStatus === 'CANCELLED' ? 'bg-red-100 text-red-700' : booking.bookingStatus === 'COMPLETED' ? 'bg-slate-100 text-slate-700' : 'bg-green-100 text-green-700'}`}>
                        {booking.bookingStatus}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex flex-wrap gap-2">
                        <button className="button-secondary text-xs" onClick={() => setSelectedBooking(booking)}>View</button>
                        {canCancel && (
                          <button className="button-secondary text-xs disabled:opacity-50" onClick={() => handleCancel(booking)} disabled={actionId === booking.bookingId}>
                            {actionId === booking.bookingId ? 'Working...' : 'Cancel'}
                          </button>
                        )}
                        {canReturn && (
                          <button className="button-primary text-xs disabled:opacity-50" onClick={() => handleReturn(booking)} disabled={actionId === booking.bookingId}>
                            {actionId === booking.bookingId ? 'Working...' : 'Return'}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {selectedBooking && (
        <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950/50 p-4" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedBooking(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="booking-details-title" className="card w-full max-w-lg p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-semibold uppercase tracking-wider text-orange-600">Booking #{selectedBooking.bookingId}</p>
                <h2 id="booking-details-title" className="mt-1 text-2xl font-bold text-slate-900">{selectedBooking.vehicleName}</h2>
              </div>
              <button type="button" className="button-secondary" onClick={() => setSelectedBooking(null)} aria-label="Close booking details">Close</button>
            </div>
            <dl className="mt-6 space-y-3 text-sm text-slate-700">
              <div className="flex justify-between gap-4"><dt>Start date</dt><dd className="font-semibold">{selectedBooking.startDate}</dd></div>
              <div className="flex justify-between gap-4"><dt>End date</dt><dd className="font-semibold">{selectedBooking.endDate}</dd></div>
              <div className="flex justify-between gap-4"><dt>Rental days</dt><dd className="font-semibold">{selectedBooking.numberOfDays}</dd></div>
              <div className="flex justify-between gap-4"><dt>Price per day</dt><dd className="font-semibold">₹{selectedBooking.pricePerDay}</dd></div>
              <div className="flex justify-between gap-4"><dt>Total</dt><dd className="font-semibold">₹{selectedBooking.totalAmount}</dd></div>
              <div className="flex justify-between gap-4"><dt>Status</dt><dd className="font-semibold">{selectedBooking.bookingStatus}</dd></div>
            </dl>
          </section>
        </div>
      )}
    </div>
  );
}
