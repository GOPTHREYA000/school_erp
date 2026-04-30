import axios from 'axios';

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
  withCredentials: true,
  xsrfCookieName: 'csrftoken',
  xsrfHeaderName: 'X-CSRFToken',
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  if (typeof document !== 'undefined') {
    const match = document.cookie.match(/(^|;\s*)csrftoken=([^;]*)/);
    if (match && match[2]) {
      config.headers['X-CSRFToken'] = match[2];
    }
  }
  return config;
});

api.interceptors.response.use(
  (response) => {
    // Automatically unwrap DRF global pagination to transparently return the array
    if (response.data && typeof response.data === 'object') {
      if (response.data.results !== undefined && response.data.count !== undefined) {
        response.data = response.data.results;
      }
    }
    return response;
  },
  async (error) => {
    // If 401, we might want to trigger a refresh logic here or redirect to login.
    const originalRequest = error.config;
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;
      try {
        await axios.post(
          `${process.env.NEXT_PUBLIC_API_URL}auth/refresh/`,
          {},
          { withCredentials: true }
        );
        return api(originalRequest);
      } catch (e) {
        if (typeof window !== 'undefined') window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

export default api;
