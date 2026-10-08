import { useCallback, useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { deleteVehicle, fetchVehicles } from '../../services/vehicleService';

export default function ManageVehicles() {
  const location = useLocation();
  const [vehicles, setVehicles] = useState([]);
  const [message, setMessage] = useState(location.state?.message || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  const loadVehicles = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const response = await fetchVehicles();
      setVehicles(response.data?.data || response.data || []);
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to load vehicles. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadVehicles();
  }, [loadVehicles]);

  const handleDelete = async (vehicle) => {
    if (!window.confirm(`Delete ${vehicle.brand} ${vehicle.model}?`)) {
      return;
    }
    setError('');
    setMessage('');
    try {
      await deleteVehicle(vehicle.vehicleId);
      setMessage(`${vehicle.brand} ${vehicle.model} deleted.`);
      await loadVehicles();
    } catch (requestError) {
      setError(requestError.response?.data?.message || 'Unable to delete this vehicle.');
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex items-center justify-between gap-4">
        <h1 className="text-3xl font-bold text-slate-900">Manage Vehicles</h1>
        <Link to="/admin/vehicles/add" className="button-primary">Add Vehicle</Link>
      </div>
      {message && <p role="status" className="mb-5 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{message}</p>}
      {error && (
        <div role="alert" className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          <span>{error}</span>
          <button type="button" onClick={loadVehicles} className="font-semibold underline">Retry</button>
        </div>
      )}
      <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-white">
        <table className="min-w-full divide-y divide-slate-200">
          <thead className="bg-slate-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Type</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Brand</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Model</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Registration</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Status</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Price / day</th>
              <th className="px-4 py-3 text-left text-sm font-semibold text-slate-700">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-200">
            {loading ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">Loading vehicles...</td></tr>
            ) : vehicles.length === 0 ? (
              <tr><td colSpan="7" className="px-4 py-8 text-center text-sm text-slate-500">No vehicles found.</td></tr>
            ) : vehicles.map((vehicle) => (
              <tr key={vehicle.vehicleId}>
                <td className="px-4 py-3 text-sm text-slate-700">{vehicle.vehicleType || vehicle.vehicleTypeValue}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{vehicle.brand}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{vehicle.model}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{vehicle.registrationNumber}</td>
                <td className="px-4 py-3 text-sm text-slate-700">{vehicle.status}</td>
                <td className="px-4 py-3 text-sm text-slate-700">₹{Number(vehicle.pricePerDay).toLocaleString('en-IN')}</td>
                <td className="px-4 py-3 text-sm">
                  <div className="flex gap-2">
                    <Link to={`/admin/vehicles/edit/${vehicle.vehicleId}`} className="button-secondary text-xs">Edit</Link>
                    <button type="button" onClick={() => handleDelete(vehicle)} className="button-secondary text-xs text-red-600">Delete</button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
