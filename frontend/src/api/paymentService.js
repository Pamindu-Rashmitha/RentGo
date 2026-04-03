import api from './axiosConfig';

export const createPayment = (formData) =>
  api.post('/payments', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const getPayments = () => api.get('/payments');

export const verifyPayment = (id) => api.patch(`/payments/${id}/verify`);

export const voidPayment = (id, voidReason) =>
  api.patch(`/payments/${id}/void`, { voidReason });
