import api from './api';

export const createPayment = (payload) => api.post('/payments', payload);
export const getPaymentByBookingId = (bookingId) => api.get(`/payments/${bookingId}`);
export const getAllPayments = () => api.get('/payments');
