import { Link, NavLink } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const customerNavItems = [
  { to: '/', label: 'Home' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/my-bookings', label: 'My Bookings' },
  { to: '/profile', label: 'Profile' }
];

const adminNavItems = [
  { to: '/admin', label: 'Dashboard', end: true },
  { to: '/admin/vehicles', label: 'Vehicles' },
  { to: '/admin/customers', label: 'Customers' },
  { to: '/admin/bookings', label: 'Bookings' },
  { to: '/admin/payments', label: 'Payments' },
  { to: '/admin/revenue', label: 'Revenue' }
];

export default function Navbar() {
  const { user, role, logout } = useAuth();
  const navItems = role === 'admin' ? adminNavItems : customerNavItems;
  const handleLogout = () => logout().catch((error) => {
    window.alert(error.response?.data?.message || 'Unable to end the server session. Please try again.');
  });

  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        <Link to="/" className="text-2xl font-extrabold tracking-tight text-slate-900">
          Ride<span className="text-orange-500">Ease</span>
        </Link>

        <nav className="hidden items-center gap-6 md:flex">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `text-sm font-medium ${isActive ? 'text-orange-600' : 'text-slate-600 hover:text-slate-900'}`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          {user ? (
            <>
              <span className="hidden text-sm font-medium text-slate-700 sm:block">{user.name || user.username}</span>
              <button className="button-secondary" onClick={handleLogout}>Logout</button>
            </>
          ) : (
            <>
              <Link to="/login" className="button-secondary">Login</Link>
              <Link to="/register" className="button-primary">Register</Link>
              <Link to="/admin-login" className="text-sm font-semibold text-slate-600 hover:text-orange-600">Admin Login</Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
