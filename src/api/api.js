import axios from "axios";

// Global session expired callback
let sessionExpiredHandler = null;
let sessionHandled = false;

// Register callback from App.jsx
export const setSessionExpiredHandler = (handler) => {
  sessionExpiredHandler = handler;
  sessionHandled = false;
};

const API = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL,
});

// Automatically attach token to every request
API.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("access_token");

    // Don't attach token for login request
    if (token && config.url !== "/auth/login") {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  },
  (error) => Promise.reject(error)
);

// Handle expired session globally
API.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if ((status === 401 || status === 403) && !sessionHandled) {
      sessionHandled = true;

      if (sessionExpiredHandler) {
        sessionExpiredHandler();
      }
    }

    return Promise.reject(error);
  }
);

export default API;