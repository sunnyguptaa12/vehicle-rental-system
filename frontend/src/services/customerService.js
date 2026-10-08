import api from './api';

export const getCustomerById = (id) => api.get(`/customers/${id}`);
export const updateCustomer = (id, payload) => api.put(`/customers/${id}`, payload);
