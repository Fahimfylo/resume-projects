// Define constants for API configuration
const isLocalhost =
  window.location.hostname === "localhost" ||
  window.location.hostname === "127.0.0.1" ||
  window.location.hostname.startsWith("192.168.") ||
  window.location.hostname.startsWith("10.") ||
  window.location.hostname.endsWith(".local");
const API_CONFIG = {
  API_ENDPOINT: isLocalhost
    ? "http://localhost:4000"
    : "https://app.prospct.io",
  TOKEN_STORAGE_KEY: "auth_token",
  USER_STORAGE_KEY: "user_data",
  DOMAIN_URL: isLocalhost ? "http://localhost:5173" : "https://app.prospct.io",
};

// Freeze the API configuration object to make it immutable
Object.freeze(API_CONFIG);

// Export the API configuration object for use in other modules
export default API_CONFIG;
