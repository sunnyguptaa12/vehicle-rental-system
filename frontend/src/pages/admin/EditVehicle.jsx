export default function EditVehicle() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8">
      <div className="card p-8">
        <h1 className="text-3xl font-bold text-slate-900">Edit Vehicle</h1>
        <form className="mt-8 space-y-5">
          <div className="grid gap-5 md:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Brand</label><input defaultValue="Hyundai" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Model</label><input defaultValue="Creta" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></div>
          </div>
          <div className="grid gap-5 md:grid-cols-2">
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Price / day</label><input defaultValue="2600" className="w-full rounded-xl border border-slate-300 px-3 py-2.5" /></div>
            <div><label className="mb-1 block text-sm font-medium text-slate-700">Status</label><select className="w-full rounded-xl border border-slate-300 px-3 py-2.5"><option>AVAILABLE</option><option>RENTED</option><option>MAINTENANCE</option></select></div>
          </div>
          <button className="button-primary w-full">Update Vehicle</button>
        </form>
      </div>
    </div>
  );
}
