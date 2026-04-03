import api from './axiosConfig';

export const createReview = (data) => api.post('/reviews', data);

export const getVehicleReviews = (vehicleId, page = 1) =>
  api.get(`/reviews/vehicle/${vehicleId}`, { params: { page } });

export const updateReview = (id, data) => api.put(`/reviews/${id}`, data);

export const deleteReview = (id) => api.delete(`/reviews/${id}`);
