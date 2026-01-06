// API Configuration
const environment = import.meta.env.VITE_ENVIRONMENT || 'local';
const localUrl = import.meta.env.VITE_API_URL_LOCAL || 'http://localhost:3000';
const productionUrl = import.meta.env.VITE_API_URL_PRODUCTION || 'https://move-vm-backend.vercel.app';

export const API_BASE_URL = environment === 'production' ? productionUrl : localUrl;

export const getApiUrl = (path: string) => {
  // Remove leading slash if present to avoid double slashes
  const cleanPath = path.startsWith('/') ? path.slice(1) : path;
  return `${API_BASE_URL}/${cleanPath}`;
};
