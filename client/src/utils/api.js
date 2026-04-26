import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'https://cloth-rentals-yi1m.onrender.com/api';

const api = axios.create({
  baseURL,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

export default api;
