import api from './api';

export const getBlogs = async () => {
  const response = await api.get('/blogs');
  return response.data;
};

export const getBlogById = async (id) => {
  const response = await api.get(`/blogs/${id}`);
  return response.data;
};
