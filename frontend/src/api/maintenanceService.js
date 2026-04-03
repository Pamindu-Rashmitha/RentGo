import api from './axiosConfig';

export const createTicket = (formData) =>
  api.post('/maintenance', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getTickets = (filters = {}) => {
  const params = {};
  if (filters.maintenanceType) params.maintenanceType = filters.maintenanceType;
  if (filters.status) params.status = filters.status;
  return api.get('/maintenance', { params });
};

export const getVehicleTickets = (vehicleId) =>
  api.get(`/maintenance/vehicle/${vehicleId}`);

export const updateTicket = (id, data) => api.patch(`/maintenance/${id}`, data);
