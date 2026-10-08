import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { addVehicle } from '../../services/vehicleService';

const initialForm = {
  vehicleType: 'Car',
  brand: '',
  model: '',
  registrationNumber: '',
  description: '',
  imageUrl: '',
  pricePerDay: ''
};

const inputClass = 'w-full rounded-xl border border-slate-300 px-3 py-2.5 outline-none focus:border-orange-500';

export default function AddVehicle() {
  const navigate = useNavigate();
  const [form, setForm] = useState(initialForm);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);

  const updateField = (event) => {
    setForm((current) => ({ ...current, [event.target.name]: event.target.value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError('');
    setSaving(true);
    try {
      await addVehicle({
        ...form,
        pricePerDay: Number(form.pricePerDay),
        status: 'AVAILABLE'
      });
      navigate('/admin/vehicles', { state: { message: 'Vehicle added successfully.' } });
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to add vehicle. Please check the details and try again.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="card p-8">
        <div className="flex items-center justify-between gap-4">
          <h1 className="text-3xl font-bold text-slate-900">Add Vehicle</h1>
          <Link to="/admin/vehicles" className="text-sm font-semibold text-slate-600 hover:text-orange-600">Back to Vehicles</Link>
        </div>
        {error && <p role="alert" className="mt-5 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="vehicleType" className="mb-1 block text-sm font-medium text-slate-700">Type</label>
              <select id="vehicleType" name="vehicleType" value={form.vehicleType} onChange={updateField} className={inputClass}>
                <option>Car</option><option>SUV</option><option>Scooter</option><option>Bike</option>
              </select>
            </div>
            <div>
              <label htmlFor="brand" className="mb-1 block text-sm font-medium text-slate-700">Brand</label>
              <input id="brand" name="brand" value={form.brand} onChange={updateField} className={inputClass} required maxLength="50" />
            </div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="model" className="mb-1 block text-sm font-medium text-slate-700">Model</label>
              <input id="model" name="model" value={form.model} onChange={updateField} className={inputClass} required maxLength="50" />
            </div>
            <div>
              <label htmlFor="registrationNumber" className="mb-1 block text-sm font-medium text-slate-700">Registration Number</label>
              <input id="registrationNumber" name="registrationNumber" value={form.registrationNumber} onChange={updateField} className={inputClass} required maxLength="50" />
            </div>
          </div>
          <div>
            <label htmlFor="description" className="mb-1 block text-sm font-medium text-slate-700">Description</label>
            <textarea id="description" name="description" value={form.description} onChange={updateField} className={inputClass} rows="4" maxLength="1000" />
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div>
              <label htmlFor="imageUrl" className="mb-1 block text-sm font-medium text-slate-700">Image URL</label>
              <input id="imageUrl" name="imageUrl" type="url" value={form.imageUrl} onChange={updateField} className={inputClass} placeholder="https://example.com/vehicle.jpg" />
            </div>
            <div>
              <label htmlFor="pricePerDay" className="mb-1 block text-sm font-medium text-slate-700">Price per day (₹)</label>
              <input id="pricePerDay" name="pricePerDay" type="number" min="1" step="0.01" value={form.pricePerDay} onChange={updateField} className={inputClass} required />
            </div>
          </div>
          <button type="submit" className="button-primary w-full disabled:cursor-not-allowed disabled:opacity-60" disabled={saving}>
            {saving ? 'Saving...' : 'Save Vehicle'}
          </button>
        </form>
      </div>
    </div>
  );
}
