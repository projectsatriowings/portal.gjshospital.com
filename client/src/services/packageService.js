import api from './api';

export const getHealthPackages = async () => {
  const response = await api.get('/health-packages');
  return response.data;
};
