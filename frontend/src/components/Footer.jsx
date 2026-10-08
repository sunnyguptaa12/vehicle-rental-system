export default function Footer() {
  return (
    <footer className="border-t border-slate-200 bg-slate-950 text-slate-200">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-12 md:grid-cols-3 sm:px-6 lg:px-8">
        <div>
          <h3 className="mb-4 text-xl font-bold text-white">RideEase</h3>
          <p className="text-sm text-slate-300">Reliable, premium, and flexible vehicle rentals for everyday travel and adventure.</p>
        </div>
        <div>
          <h4 className="mb-4 text-lg font-semibold text-white">Quick Links</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>Home</li>
            <li>Vehicles</li>
            <li>Bookings</li>
            <li>Admin</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-4 text-lg font-semibold text-white">Support</h4>
          <ul className="space-y-2 text-sm text-slate-300">
            <li>FAQs</li>
            <li>Help Center</li>
            <li>Privacy Policy</li>
            <li>
              Help Line:{' '}
              <a className="hover:text-white" href="tel:9546661632">9546661632</a>
            </li>
            <li>
              Email Support:{' '}
              <a className="hover:text-white" href="mailto:kumar545sunny@gmail.com">kumar545sunny@gmail.com</a>
            </li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
