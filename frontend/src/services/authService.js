import api from './api';

export const registerCustomer = (payload) => api.post('/auth/register', payload);
export const loginCustomer = (payload) => api.post('/auth/login', payload);
export const adminLogin = (payload) => api.post('/auth/admin-login', payload);
export const logoutSession = () => api.post('/auth/logout');
