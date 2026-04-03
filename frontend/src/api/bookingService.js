import api from './axiosConfig';

export const createBooking = (formData) =>
  api.post('/bookings', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getBookings = (filters = {}) => {
  const params = {};
  if (filters.status) params.status = filters.status;
  if (filters.vehicleId) params.vehicleId = filters.vehicleId;
  if (filters.userId) params.userId = filters.userId;
  if (filters.startDate) params.startDate = filters.startDate;
  if (filters.endDate) params.endDate = filters.endDate;
  return api.get('/bookings', { params });
};

export const getBookingById = (id) => api.get(`/bookings/${id}`);

export const updateBookingStatus = (id, status) =>
  api.patch(`/bookings/${id}/status`, { status });

export const cancelBooking = (id) => api.patch(`/bookings/${id}/cancel`);
