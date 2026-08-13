import Cookies from "js-cookie";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import useStore from "../../store/store";
import API_CONFIG from "../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

const LogoutButton = () => {
    const navigate = useNavigate();
    const { setAdminIsLoggedIn, setAdmin } = useStore();

    const handleLogout = async () => {
        const token = Cookies.get("adminAccessToken");

        // Call backend to invalidate the token in DB
        if (token) {
            try {
                await axios.post(
                    `${BASE_URL}/api/auth/admin-logout`,
                    null,
                    { headers: { Authorization: `Bearer ${token}` } }
                );
            } catch (err) {
                // console.error("Logout error:", err);
            }
        }

        // Remove cookie and clear state
        Cookies.remove("adminAccessToken");
        localStorage.removeItem("adminAccessToken"); // clean up any legacy entry
        setAdminIsLoggedIn(false);
        setAdmin(null);

        navigate("/admin-login");
    };

    return (
        <button
            onClick={handleLogout}
            className="sm:inline-flex text-white bg-gradient-to-br from-sky-500 to-blue-500 font-medium rounded-md text-sm px-6 py-2 h-9 w-full text-center inline-flex justify-center items-center shadow-md shadow-gray-300 dark:shadow-gray-800 hover:scale-[1.02] transition-transform z-20"
        >
            Logout
        </button>
    );
};

export default LogoutButton;
