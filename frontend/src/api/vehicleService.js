import api from './axiosConfig';

export const getVehicles = (filters = {}) => {
  const params = {};
  if (filters.fuelType) params.fuelType = filters.fuelType;
  if (filters.transmission) params.transmission = filters.transmission;
  if (filters.seatingCapacity) params.seatingCapacity = filters.seatingCapacity;
  if (filters.minPrice) params.minPrice = filters.minPrice;
  if (filters.maxPrice) params.maxPrice = filters.maxPrice;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return api.get('/vehicles', { params });
};

export const getVehicleById = (id) => api.get(`/vehicles/${id}`);

export const createVehicle = (formData) =>
  api.post('/vehicles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const updateVehicle = (id, formData) =>
  api.put(`/vehicles/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const deleteVehicle = (id) => api.delete(`/vehicles/${id}`);
