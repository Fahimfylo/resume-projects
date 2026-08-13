import axios from "axios";
import Cookies from "js-cookie";
import useStore from "../store/store";
import API_CONFIG from "./apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const checkAdminLoginStatus = async () => {
  const { setAdminIsLoggedIn, setAdmin } = useStore.getState();
  const adminAccessToken = Cookies.get("adminAccessToken");

  if (!adminAccessToken) {
    setAdminIsLoggedIn(false);
    return;
  }

  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/verify-admin-token`,
      null,
      {
        headers: {
          Authorization: `Bearer ${adminAccessToken}`,
        },
      }
    );

    if (response.status === 200) {
      setAdminIsLoggedIn(true);
      setAdmin(response.data.admin);
      if (response.data.adminAccessToken) {
        // reset cookie expiry with new token
        Cookies.set("adminAccessToken", response.data.adminAccessToken, { expires: 30 });
      }
    } else {
      setAdminIsLoggedIn(false);
      setAdmin(null);
      Cookies.remove("adminAccessToken");
    }
  } catch (error) {
    // console.error("Error checking token validity:", error);

    // Avoid logging out the admin if the failure was due to a transient network issue.
    if (error.response?.status === 401) {
      setAdminIsLoggedIn(false);
      setAdmin(null);
      Cookies.remove("adminAccessToken");
    }
  }
};

export default checkAdminLoginStatus;
