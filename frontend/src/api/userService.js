import axios from './axiosConfig';

export const getAllUsers = async () => {
  const response = await axios.get('/users');
  return response.data;
};

export const deleteUser = async (userId) => {
  const response = await axios.delete(`/users/${userId}`);
  return response.data;
};

export const updateProfile = async (userData) => {
  const response = await axios.put('/users/profile', userData);
  return response.data;
};
