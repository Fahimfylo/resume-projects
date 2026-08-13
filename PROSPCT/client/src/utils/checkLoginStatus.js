import axios from "axios";

import useStore from "../store/store";
import API_CONFIG from "./apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const checkLoginStatus = async () => {
  const { setIsLoggedIn, setUser } = useStore.getState();
  const userAccessToken = localStorage.getItem("userAccessToken");

  if (!userAccessToken) {
    setIsLoggedIn(false);
    return;
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/verify-token`,
      null,
      {
        headers: {
          Authorization: `Bearer ${userAccessToken}`,
        },
      }
    );

    if (response.status === 200) {
      setIsLoggedIn(true);
      setUser(response.data.user);
      if (response.data.accessToken) {
        localStorage.setItem("userAccessToken", response.data.accessToken);
      }
    } else {
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem("userAccessToken");
    }
  } catch (error) {
    // console.error("Error checking token validity:", error);

    // Handle unverified user — redirect to verification
    if (error.response?.status === 403 && error.response?.data?.needsVerification) {
      const userFromToken = JSON.parse(localStorage.getItem("user") || "{}");
      window.location.href = `/verify-email?tempToken=${userAccessToken}`;
      return;
    }

    // Only clear auth state when we know the token is invalid/expired.
    // This prevents temporary network issues from logging the user out.
    if (error.response?.status === 401) {
      setIsLoggedIn(false);
      setUser(null);
      localStorage.removeItem("userAccessToken");
    }
  }
};

export default checkLoginStatus;
