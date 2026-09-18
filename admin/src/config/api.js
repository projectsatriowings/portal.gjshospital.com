// Centralized API and Backend Server Configuration
export const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:5000/api')).replace(/\/+$/, '');
export const SERVER_BASE_URL = API_BASE_URL.replace(/\/api\/?$/, '');
export const AUTH_BASE_URL = `${SERVER_BASE_URL}/admin/auth`;

/**
 * Helper to construct full URL for static files (uploads, generated PDFs, images)
 * @param {string} path - Relative file path e.g. '/uploads/doctors/doc-1.jpg' or '/pdfs/invoice.pdf'
 * @returns {string} Fully qualified URL
 */
export const getFileUrl = (path) => {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SERVER_BASE_URL}${cleanPath}`;
};

export default {
  API_BASE_URL,
  SERVER_BASE_URL,
  AUTH_BASE_URL,
  getFileUrl,
};
