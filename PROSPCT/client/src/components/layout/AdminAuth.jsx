import { useLocation, Navigate, Outlet } from "react-router-dom";
import Cookies from "js-cookie";

const AdminAuth = () => {
  const location = useLocation();
  const token = Cookies.get("adminAccessToken");
  return token ? (
    <Outlet />
  ) : (
    <Navigate to="/admin-login" state={{ from: location }} replace />
  );
};

export default AdminAuth;
