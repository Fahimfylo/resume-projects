import { useEffect } from "react";
import axios from "axios";
import Cookies from "js-cookie";
import { toast } from "react-toastify";
import API_CONFIG from "../../utils/apiConstant";
import { useNavigate } from "react-router-dom";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function TelegramLogin() {
  const navigate = useNavigate();
  useEffect(() => {
    // Create and append the Telegram widget script
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", "ProspctBot"); // Your bot username
    script.setAttribute("data-size", "medium");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-onauth", "onTelegramAuth(user)"); // Callback function
    script.setAttribute("data-request-access", "write");

    document.getElementById("telegram-login-button").appendChild(script);

    // Global function to handle Telegram authentication
    window.onTelegramAuth = async (user) => {
      try {
        const response = await axios.post(
          `${BASE_URL}/api/auth/telegram/callback`,
          user
        );

        const { accessToken, user: loggedInUser } = response.data;

        // Set cookie or state with accessToken and user information
        localStorage.setItem("userAccessToken", accessToken);
        Cookies.set("userAccessToken", accessToken, { expires: 8 });

        toast.success(`Welcome back, ${loggedInUser.firstName}!`);
        // Redirect to dashboard or another page
        navigate("/dashboard");
      } catch (error) {
        // console.error("Error during Telegram login:", error);
        toast.error("Login failed. Please try again.");
      }
    };

    return () => {
      // Clean up the script if necessary
      const telegramButton = document.getElementById("telegram-login-button");
      if (telegramButton) {
        telegramButton.removeChild(script);
      }
    };
  }, []);

  return <div id="telegram-login-button"></div>;
}
