import { useLocation, Navigate, Outlet } from "react-router-dom";

const RequiredAuth = () => {
  const location = useLocation();
  // Check ONLY user token - completely independent from admin
  const token = localStorage.getItem("userAccessToken");
  return token ? (
    <Outlet />
  ) : (
    <Navigate to="/login" state={{ from: location }} replace />
  );
};

export default RequiredAuth;
