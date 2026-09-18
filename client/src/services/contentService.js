import api from './api';

export const getTestimonials = async () => {
  const response = await api.get('/testimonials');
  return response.data;
};

export const getBanners = async () => {
  const response = await api.get('/banners');
  return response.data;
};

export const getInsurancePartners = async () => {
  const response = await api.get('/partners');
  return response.data;
};

export const getGallery = async () => {
  const response = await api.get('/gallery');
  return response.data;
};
