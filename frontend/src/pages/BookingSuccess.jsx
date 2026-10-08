import { useEffect, useState } from 'react';
import { Link, Navigate, useLocation } from 'react-router-dom';
import { getBookingById } from '../services/bookingService';
import { getPaymentByBookingId } from '../services/paymentService';
import { fetchVehicleById } from '../services/vehicleService';

export default function BookingSuccess() {
  const location = useLocation();
  const { bookingId } = location.state || {};
  const [booking, setBooking] = useState(null);
  const [payment, setPayment] = useState(null);
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!bookingId) return undefined;
    let active = true;
    Promise.all([getBookingById(bookingId), getPaymentByBookingId(bookingId)])
      .then(async ([bookingResponse, paymentResponse]) => {
        const bookingData = bookingResponse.data?.data;
        if (!active) return;
        setBooking(bookingData);
        setPayment(paymentResponse.data?.data);
        try {
          const vehicleResponse = await fetchVehicleById(bookingData.vehicleId);
          if (active) setVehicle(vehicleResponse.data?.data || vehicleResponse.data);
        } catch {
          if (active) setError('Booking and payment are confirmed, but vehicle details could not be loaded.');
        }
      })
      .catch((loadError) => {
        if (active) setError(loadError.response?.data?.message || 'Unable to load the receipt details.');
      });
    return () => {
      active = false;
    };
  }, [bookingId]);

  if (!bookingId) {
    return <Navigate to="/my-bookings" replace />;
  }

  const totalAmount = Number(payment?.amount ?? booking?.totalAmount ?? location.state?.totalAmount) || 0;

  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <div id="printable-receipt" className="card p-10 text-center">
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100 text-3xl">✓</div>
        <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-600">RideEase</p>
        <h1 className="mt-2 text-4xl font-black text-slate-900">Payment Successful!</h1>
        <p className="mt-4 text-lg text-slate-600">Booking Confirmed!</p>
        {error && <p role="alert" className="mt-4 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">{error}</p>}
        <div className="mt-6 rounded-2xl bg-slate-100 p-5 text-left text-sm text-slate-700">
          <div className="flex justify-between gap-4"><span>Booking ID</span><strong>#{bookingId}</strong></div>
          {vehicle && <div className="mt-2 flex justify-between gap-4"><span>Vehicle</span><strong>{vehicle.brand} {vehicle.model}</strong></div>}
          {booking && <div className="mt-2 flex justify-between gap-4"><span>Rental dates</span><strong>{booking.startDate} → {booking.endDate}</strong></div>}
          {booking && <div className="mt-2 flex justify-between gap-4"><span>Rental days</span><strong>{booking.numberOfDays}</strong></div>}
          {payment && <div className="mt-2 flex justify-between gap-4"><span>Payment method</span><strong>{payment.paymentMethod}</strong></div>}
          {payment?.paymentDate && <div className="mt-2 flex justify-between gap-4"><span>Payment date</span><strong>{payment.paymentDate.replace('T', ' ')}</strong></div>}
          <div className="mt-3 flex justify-between gap-4 border-t border-slate-300 pt-3"><span>Amount Paid</span><strong>₹{totalAmount}</strong></div>
        </div>
        <div className="no-print mt-8 flex flex-wrap justify-center gap-4">
          <Link to="/my-bookings" state={{ focusBookingId: bookingId }} className="button-primary">View Booking</Link>
          <button type="button" className="button-secondary" onClick={() => window.print()}>Print Receipt</button>
          <Link to="/" className="button-secondary">Back to Dashboard</Link>
        </div>
      </div>
    </div>
  );
}
