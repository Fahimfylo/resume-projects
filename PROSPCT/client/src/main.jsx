import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import axios from 'axios'
import App from './App.jsx'
import './index.css'

// Default timeout for all axios requests (120s — matches MongoDB maxTimeMS)
axios.defaults.timeout = 120000;

// Global interceptor to inject the user auth token securely
axios.interceptors.request.use((config) => {
  // Don't override Authorization header if it's already set (e.g., tempToken for OTP verification)
  if (config.headers.Authorization) {
    return config;
  }
  const token = localStorage.getItem("userAccessToken");
  if (token && token !== "undefined" && token !== "null") {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => {
  return Promise.reject(error);
});

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
