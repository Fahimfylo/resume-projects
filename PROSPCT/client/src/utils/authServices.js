
import axios from "axios";
import API_CONFIG from "./apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const logout = async () => {
  try {
    // Get the access token from cookies
    const accessToken = localStorage.getItem("userAccessToken");

    // Set the authorization header with the token
    const config = {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    };

    // Send a POST request to the logout endpoint with the authorization header
    const response = await axios.post(`${BASE_URL}/api/auth/logout`, null, config);

    // Clear token from cookies
    localStorage.removeItem("userAccessToken");


    return response; // Return the response from the logout request
  } catch (error) {
    // console.error("Logout failed:", error);
    throw error; // Throw the error to be handled by the caller
  }
};

export { logout };
