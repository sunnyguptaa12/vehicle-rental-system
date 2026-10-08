import api from './api';

export const fetchVehicles = () => api.get('/vehicles');
export const fetchVehicleById = (id) => api.get(`/vehicles/${id}`);
export const fetchAvailableVehicles = () => api.get('/vehicles/available');
export const searchVehicles = (query) => api.get(`/vehicles/search?q=${encodeURIComponent(query)}`);
export const addVehicle = (payload) => api.post('/vehicles', payload);
export const updateVehicle = (id, payload) => api.put(`/vehicles/${id}`, payload);
export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`);
