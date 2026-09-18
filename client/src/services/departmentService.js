import api from './api';

export const getDepartments = async () => {
  const response = await api.get('/departments');
  if (response.data && response.data.success && Array.isArray(response.data.data)) {
    response.data.data = response.data.data.filter(d => d.publish_status === 'published');
  }
  return response.data;
};

export const getDepartmentByIdOrSlug = async (idOrSlug, isPreview = false) => {
  const response = await api.get(`/departments/${idOrSlug}${isPreview ? '?preview=true' : ''}`);
  return response.data;
};
