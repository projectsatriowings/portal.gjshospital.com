import { API_BASE_URL } from './api';

export const getOutsourcedServices = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/outsourced-services`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error in getOutsourcedServices:', err);
    return { success: false, data: [] };
  }
};

export const getFacilityServices = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/facility-services`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error in getFacilityServices:', err);
    return { success: false, data: [] };
  }
};

export const getInfrastructureServices = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/infrastructure-services`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error in getInfrastructureServices:', err);
    return { success: false, data: [] };
  }
};

export const getAccreditations = async () => {
  try {
    const res = await fetch(`${API_BASE_URL}/accreditations`);
    if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('Error in getAccreditations:', err);
    return { success: false, data: [] };
  }
};
