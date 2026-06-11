import axios from "axios";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.MODE === "development" 
    ? "http://localhost:5001/api" 
    : (typeof window !== "undefined" && window.location.origin.includes("pages.dev") ? "https://Blink.koyeb.app/api" : "/api"),
  withCredentials: true,
});

// Add a request interceptor to attach Authorization header if token is in localStorage
axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle 401 Unauthorized globally
axiosInstance.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error?.response?.status === 401) {
      // Clear stored token
      localStorage.removeItem('token');
      // Optionally show a toast notification
      try {
        // Dynamically import toast to avoid circular imports
        const toast = require('react-hot-toast').default;
        toast.error('Session expired. Please log in again.');
      } catch (e) {
        // ignore if toast import fails
      }
      // Redirect to login page if possible
      if (typeof window !== 'undefined') {
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);
