import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import Cookies from "js-cookie";

const LinkedinAuthSuccess = () => {
  const navigate = useNavigate();
  const { setIsLoggedIn, setUser } = useStore();

  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const token = queryParams.get("token");
    const userId = queryParams.get("userId");
    const email = queryParams.get("email");
    const firstName = queryParams.get("firstName");
    const lastName = queryParams.get("lastName");
    const role = queryParams.get("role");

    if (token) {
      Cookies.set("accessToken", token, { expires: 8 }); // Set token in cookies

      setUser({ userId, email, firstName, lastName, role });
      setIsLoggedIn(true);
      navigate("/dashboard"); // Redirect to dashboard or desired route
    } else {
      // Handle error - e.g., show an error message
      // console.error("No token found");
    }
  }, [navigate, setIsLoggedIn, setUser]);

  return (
    <div>
      <h2>Logging in...</h2>
    </div>
  );
};

export default LinkedinAuthSuccess;
