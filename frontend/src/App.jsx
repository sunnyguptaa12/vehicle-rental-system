import { Route, Routes } from 'react-router-dom';
import Navbar from './components/Navbar';
import Footer from './components/Footer';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Login from './pages/Login';
import Register from './pages/Register';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import Booking from './pages/Booking';
import Payment from './pages/Payment';
import BookingSuccess from './pages/BookingSuccess';
import MyBookings from './pages/MyBookings';
import Profile from './pages/Profile';
import AdminLogin from './pages/admin/AdminLogin';
import AdminDashboard from './pages/admin/AdminDashboard';
import ManageVehicles from './pages/admin/ManageVehicles';
import AddVehicle from './pages/admin/AddVehicle';
import EditVehicle from './pages/admin/EditVehicle';
import ManageCustomers from './pages/admin/ManageCustomers';
import ManageBookings from './pages/admin/ManageBookings';
import ManagePayments from './pages/admin/ManagePayments';
import Revenue from './pages/admin/Revenue';

export default function App() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      <Navbar />
      <main className="min-h-[70vh]">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/vehicles" element={<Vehicles />} />
          <Route path="/vehicles/:id" element={<VehicleDetails />} />
          <Route path="/booking/:id" element={<ProtectedRoute><Booking /></ProtectedRoute>} />
          <Route path="/payment" element={<ProtectedRoute><Payment /></ProtectedRoute>} />
          <Route path="/booking-success" element={<ProtectedRoute><BookingSuccess /></ProtectedRoute>} />
          <Route path="/my-bookings" element={<ProtectedRoute><MyBookings /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute><Profile /></ProtectedRoute>} />

          <Route path="/admin-login" element={<AdminLogin />} />
          <Route path="/admin" element={<ProtectedRoute requireRole="admin"><AdminDashboard /></ProtectedRoute>} />
          <Route path="/admin/vehicles" element={<ProtectedRoute requireRole="admin"><ManageVehicles /></ProtectedRoute>} />
          <Route path="/admin/vehicles/add" element={<ProtectedRoute requireRole="admin"><AddVehicle /></ProtectedRoute>} />
          <Route path="/admin/vehicles/edit/:id" element={<ProtectedRoute requireRole="admin"><EditVehicle /></ProtectedRoute>} />
          <Route path="/admin/customers" element={<ProtectedRoute requireRole="admin"><ManageCustomers /></ProtectedRoute>} />
          <Route path="/admin/bookings" element={<ProtectedRoute requireRole="admin"><ManageBookings /></ProtectedRoute>} />
          <Route path="/admin/payments" element={<ProtectedRoute requireRole="admin"><ManagePayments /></ProtectedRoute>} />
          <Route path="/admin/revenue" element={<ProtectedRoute requireRole="admin"><Revenue /></ProtectedRoute>} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}
