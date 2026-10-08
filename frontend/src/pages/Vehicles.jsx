import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { fetchVehicles } from '../services/vehicleService';

export default function Vehicles() {
  const [vehicles, setVehicles] = useState([]);
  const [query, setQuery] = useState('');
  const [type, setType] = useState('all');

  useEffect(() => {
    fetchVehicles().then((res) => {
      const list = res.data?.data || res.data || [];
      setVehicles(Array.isArray(list) ? list : []);
    }).catch(() => setVehicles([]));
  }, []);

  const filteredVehicles = vehicles.filter((vehicle) => {
    const matchesQuery = !query || `${vehicle.brand} ${vehicle.model}`.toLowerCase().includes(query.toLowerCase());
    const matchesType = type === 'all' || vehicle.vehicleType?.toLowerCase() === type.toLowerCase();
    return matchesQuery && matchesType;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Browse</p>
          <h1 className="mt-2 text-3xl font-bold text-slate-900">Available vehicles</h1>
        </div>
        <div className="flex gap-3">
          <input
            type="text"
            placeholder="Search vehicle"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="rounded-xl border border-slate-300 px-3 py-2.5"
          />
          <select value={type} onChange={(e) => setType(e.target.value)} className="rounded-xl border border-slate-300 px-3 py-2.5">
            <option value="all">All types</option>
            <option value="car">Car</option>
            <option value="scooter">Scooter</option>
            <option value="bike">Bike</option>
            <option value="suv">SUV</option>
          </select>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        {filteredVehicles.map((vehicle) => (
          <div key={vehicle.vehicleId || vehicle.id} className="card overflow-hidden">
            <img src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7'} alt={vehicle.model} className="h-52 w-full object-cover" />
            <div className="p-5">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="text-xl font-bold text-slate-900">{vehicle.brand} {vehicle.model}</h3>
                <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">{vehicle.vehicleType || vehicle.type || 'Vehicle'}</span>
              </div>
              <p className="text-sm text-slate-500">₹{vehicle.pricePerDay || vehicle.price}/day</p>
              <p className="mt-3 text-sm text-slate-600">Status: {vehicle.status || 'AVAILABLE'}</p>
              <div className="mt-5 flex gap-3">
                <Link to={`/vehicles/${vehicle.vehicleId || vehicle.id}`} className="button-secondary flex-1">View Details</Link>
                <Link to={`/booking/${vehicle.vehicleId || vehicle.id}`} className="button-primary flex-1">Book Now</Link>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredVehicles.length === 0 && (
        <div className="mt-10 rounded-2xl border border-dashed border-slate-300 bg-white p-8 text-center text-slate-500">
          No vehicles match your search.
        </div>
      )}
    </div>
  );
}
