import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createBooking } from '../services/bookingService';
import { fetchVehicleById } from '../services/vehicleService';

function formatDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function addDays(date, days) {
  const result = new Date(`${date}T00:00:00`);
  result.setDate(result.getDate() + days);
  return formatDate(result);
}

export default function Booking() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [form, setForm] = useState({
    startDate: '',
    endDate: '',
    paymentMethod: 'UPI'
  });
  const [vehicle, setVehicle] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const today = formatDate(new Date());

  useEffect(() => {
    let active = true;
    fetchVehicleById(id)
      .then((response) => {
        if (active) setVehicle(response.data?.data || response.data);
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.response?.data?.message || 'Unable to load vehicle details');
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [id]);

  const pricePerDay = Number(vehicle?.pricePerDay) || 0;
  const validDates = Boolean(
    form.startDate &&
    form.endDate &&
    form.startDate >= today &&
    form.endDate > form.startDate
  );
  const days = validDates
    ? Math.round((new Date(`${form.endDate}T00:00:00`) - new Date(`${form.startDate}T00:00:00`)) / 86400000) + 1
    : 0;
  const baseRent = pricePerDay * days;
  const tax = Math.round(baseRent * 0.05);
  const total = baseRent + tax;

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    if (!validDates) {
      setError('Select a valid start and end date before proceeding to payment.');
      return;
    }

    setSubmitting(true);
    try {
      const response = await createBooking({
        customerId: user?.customerId,
        vehicleId: Number(id),
        startDate: form.startDate,
        endDate: form.endDate
      });
      const booking = response.data?.data;
      if (!booking?.bookingId) {
        throw new Error('Booking was created without a booking ID');
      }
      navigate('/payment', {
        state: {
          bookingId: booking.bookingId,
          totalAmount: booking.totalAmount,
          vehicleId: Number(id),
          paymentMethod: form.paymentMethod
        }
      });
    } catch (submitError) {
      setError(submitError.response?.data?.message || submitError.message || 'Booking failed');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="mx-auto max-w-5xl px-4 py-12 text-slate-600">Loading vehicle...</div>;
  }

  if (!vehicle) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="card p-8">
          <p className="text-red-700">{error || 'Vehicle not found.'}</p>
          <Link to="/vehicles" className="button-secondary mt-5">Browse vehicles</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1fr,0.8fr]">
        <div className="card p-8">
          <h1 className="text-3xl font-bold text-slate-900">Confirm Rental</h1>
          <p className="mt-2 text-slate-600">{vehicle.brand} {vehicle.model}</p>
          {error && <div role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</div>}
          <form onSubmit={handleSubmit} className="mt-8 space-y-5">
            <div>
              <label htmlFor="start-date" className="mb-1 block text-sm font-medium text-slate-700">Start date</label>
              <input
                id="start-date"
                type="date"
                min={today}
                value={form.startDate}
                onChange={(event) => {
                  const startDate = event.target.value;
                  setForm((current) => ({
                    ...current,
                    startDate,
                    endDate: current.endDate > startDate ? current.endDate : ''
                  }));
                }}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                required
              />
            </div>
            <div>
              <label htmlFor="end-date" className="mb-1 block text-sm font-medium text-slate-700">End date</label>
              <input
                id="end-date"
                type="date"
                min={form.startDate ? addDays(form.startDate, 1) : addDays(today, 1)}
                value={form.endDate}
                onChange={(event) => setForm((current) => ({ ...current, endDate: event.target.value }))}
                className="w-full rounded-xl border border-slate-300 px-3 py-2.5"
                required
              />
            </div>
            <div>
              <label htmlFor="payment-method" className="mb-1 block text-sm font-medium text-slate-700">Payment method</label>
              <select id="payment-method" value={form.paymentMethod} onChange={(event) => setForm({ ...form, paymentMethod: event.target.value })} className="w-full rounded-xl border border-slate-300 px-3 py-2.5">
                <option value="UPI">UPI</option>
                <option value="CARD">Card</option>
                <option value="CASH">Cash</option>
              </select>
            </div>
            <button className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-50" type="submit" disabled={!validDates || submitting}>
              {submitting ? 'Creating booking...' : validDates ? 'Proceed to Payment' : 'Select dates to continue'}
            </button>
          </form>
        </div>

        <div className="card p-6">
          <h2 className="text-2xl font-bold text-slate-900">Rental Summary</h2>
          {validDates ? (
            <div className="mt-6 space-y-3 text-sm text-slate-600">
              <div className="flex justify-between"><span>Price per day</span><strong>₹{pricePerDay}</strong></div>
              <div className="flex justify-between"><span>Days</span><strong>{days}</strong></div>
              <div className="flex justify-between"><span>Base rent</span><strong>₹{baseRent}</strong></div>
              <div className="flex justify-between"><span>Tax</span><strong>₹{tax}</strong></div>
              <div className="flex justify-between border-t border-slate-200 pt-3 text-base font-bold text-slate-800"><span>Total</span><strong>₹{total}</strong></div>
            </div>
          ) : (
            <p className="mt-6 text-sm text-slate-500">Choose valid rental dates to calculate the price.</p>
          )}
          <Link to="/vehicles" className="button-secondary mt-6 w-full">Cancel</Link>
        </div>
      </div>
    </div>
  );
}
