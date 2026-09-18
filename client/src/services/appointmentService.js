import api from './api';

export const createAppointment = async (appointmentData) => {
  const response = await api.post('/appointments', appointmentData);
  return response.data;
};

export const uploadReport = async (formData) => {
  const response = await api.post('/appointments/upload-report', formData);
  return response.data;
};

export const checkAppointmentStatus = async (appointmentId, mobile) => {
  const response = await api.get('/appointments/status', {
    params: { appointmentId, mobile },
  });
  return response.data;
};

export const bookPackage = async (packageBookingData) => {
  const response = await api.post('/appointments/package', packageBookingData);
  return response.data;
};
