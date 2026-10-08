export default function Loading({ label = 'Loading...' }) {
  return (
    <div className="flex min-h-[200px] items-center justify-center">
      <div className="flex items-center gap-3 rounded-full border border-slate-200 bg-white px-4 py-2 shadow-sm">
        <div className="h-4 w-4 animate-spin rounded-full border-2 border-orange-500 border-t-transparent" />
        <span className="text-sm font-medium text-slate-600">{label}</span>
      </div>
    </div>
  );
}
