import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchVehicleById } from '../services/vehicleService';

export default function VehicleDetails() {
  const { id } = useParams();
  const [vehicle, setVehicle] = useState(null);

  useEffect(() => {
    fetchVehicleById(id).then((res) => {
      setVehicle(res.data?.data || res.data || null);
    }).catch(() => setVehicle(null));
  }, [id]);

  if (!vehicle) {
    return <div className="mx-auto max-w-7xl px-4 py-16 text-center text-slate-500">Loading vehicle details...</div>;
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="grid gap-8 lg:grid-cols-[1.2fr,0.8fr]">
        <div className="card overflow-hidden">
          <img src={vehicle.imageUrl || 'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7'} alt={vehicle.model} className="h-[420px] w-full object-cover" />
        </div>
        <div className="card p-6">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">{vehicle.vehicleType || 'Vehicle'}</p>
          <h1 className="mt-3 text-4xl font-bold text-slate-900">{vehicle.brand} {vehicle.model}</h1>
          <p className="mt-4 text-lg font-semibold text-slate-800">₹{vehicle.pricePerDay || vehicle.price}/day</p>
          <p className="mt-4 text-slate-600">{vehicle.description || 'Premium, reliable, and comfortable for everyday and long-distance travel.'}</p>
          <div className="mt-6 space-y-3 text-sm text-slate-600">
            <div className="flex justify-between"><span>Availability</span><strong>{vehicle.status || 'AVAILABLE'}</strong></div>
            <div className="flex justify-between"><span>Registration</span><strong>{vehicle.registrationNumber || 'N/A'}</strong></div>
          </div>
          <div className="mt-8 flex gap-3">
            <Link to={`/booking/${vehicle.vehicleId || vehicle.id}`} className="button-primary flex-1">Book Now</Link>
            <Link to="/vehicles" className="button-secondary flex-1">Back to vehicles</Link>
          </div>
        </div>
      </div>
    </div>
  );
}
