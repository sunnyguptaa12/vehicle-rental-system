import api from './api';

export const createBooking = (payload) => api.post('/bookings', payload);
export const getBookingById = (id) => api.get(`/bookings/${id}`);
export const getCustomerBookings = (customerId) => api.get(`/bookings/customer/${customerId}`);
export const getAllBookings = () => api.get('/bookings');
export const cancelBooking = (id, payload) => api.put(`/bookings/${id}/cancel`, payload);
export const returnVehicle = (id, payload) => api.put(`/bookings/${id}/return`, payload);
