import api from './api';

export const getDoctors = async (params = {}) => {
  const response = await api.get('/doctors', { params });
  return response.data;
};

export const getDoctorById = async (id) => {
  const response = await api.get(`/doctors/${id}`);
  return response.data;
};

export const getDoctorAvailability = async (id) => {
  const response = await api.get(`/doctors/${id}/availability`);
  return response.data;
};
