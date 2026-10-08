import { Link } from 'react-router-dom';

const sampleVehicles = [
  { id: 1, name: 'Hyundai Creta', price: 2600, type: 'SUV', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/2/21/2024_Hyundai_Creta_1.5_MPi_SX%28O%29_%28India%29_front_view.png/960px-2024_Hyundai_Creta_1.5_MPi_SX%28O%29_%28India%29_front_view.png' },
  { id: 2, name: 'Honda City', price: 2400, type: 'Car', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/e/e7/Honda_City_1.5_i-VTEC_V_%28VIII%2C_Facelift%29_%E2%80%93_f_22032025.jpg/960px-Honda_City_1.5_i-VTEC_V_%28VIII%2C_Facelift%29_%E2%80%93_f_22032025.jpg' },
  { id: 3, name: 'Royal Enfield Classic 350', price: 1200, type: 'Bike', image: 'https://thumb.wikimedia.org/wikipedia/commons/thumb/7/73/Royal_Enfield_Classic_350.jpg/960px-Royal_Enfield_Classic_350.jpg' }
];

export default function Home() {
  return (
    <div>
      <section className="bg-slate-950 text-white">
        <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-20 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div>
            <span className="mb-4 inline-block rounded-full border border-orange-400/40 bg-orange-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-orange-300">
              Affordable. Reliable. Easy.
            </span>
            <h1 className="text-4xl font-black leading-tight md:text-6xl">Rent Your Perfect Ride</h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Discover premium vehicles, flexible pricing, and a seamless rental experience built for daily travel and weekend adventures.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link to="/vehicles" className="button-primary">Explore Vehicles</Link>
            </div>
          </div>
          <div className="rounded-3xl border border-white/10 bg-white/5 p-6 shadow-2xl shadow-orange-500/10">
            <img
              src="https://images.unsplash.com/photo-1492144534655-ae79c964c9d7"
              alt="Featured vehicle"
              className="h-[420px] w-full rounded-2xl object-cover"
            />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.2em] text-orange-500">Popular picks</p>
            <h2 className="mt-2 text-3xl font-bold text-slate-900">Fast booking. Trusted rides.</h2>
          </div>
          <Link to="/vehicles" className="text-sm font-semibold text-orange-600">View all vehicles →</Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {sampleVehicles.map((vehicle) => (
            <div key={vehicle.id} className="card overflow-hidden">
              <img src={vehicle.image} alt={vehicle.name} className="h-52 w-full object-cover" />
              <div className="p-5">
                <div className="mb-2 flex items-center justify-between">
                  <h3 className="text-xl font-bold text-slate-900">{vehicle.name}</h3>
                  <span className="rounded-full bg-orange-100 px-2 py-1 text-xs font-semibold text-orange-700">{vehicle.type}</span>
                </div>
                <p className="text-sm text-slate-500">From ₹{vehicle.price}/day</p>
                <Link to={`/vehicles/${vehicle.id}`} className="button-primary mt-4 w-full">View Details</Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-slate-900">How it works</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {['Search a vehicle', 'Choose dates and pay', 'Pick up and enjoy'].map((title, index) => (
              <div key={title} className="card p-6">
                <div className="mb-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-orange-100 font-bold text-orange-700">
                  {index + 1}
                </div>
                <h3 className="text-xl font-bold text-slate-900">{title}</h3>
                <p className="mt-2 text-slate-600">A simple process designed to save time and reduce friction.</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
