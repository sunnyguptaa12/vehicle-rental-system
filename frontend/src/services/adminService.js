import api from './api';

export const getDashboard = () => api.get('/admin/dashboard');
export const getAdminCustomers = () => api.get('/admin/customers');
export const getAdminBookings = () => api.get('/admin/bookings');
export const getRevenue = () => api.get('/admin/revenue');
export const updateAdminCustomer = (id, payload) => api.put(`/admin/customers/${id}`, payload);
export const cancelAdminBooking = (id) => api.put(`/admin/bookings/${id}/cancel`);
export const returnAdminBooking = (id) => api.put(`/admin/bookings/${id}/return`);
