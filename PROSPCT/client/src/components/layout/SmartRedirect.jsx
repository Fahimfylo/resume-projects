import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import Cookies from "js-cookie";

/**
 * SmartRedirect - Landing page when both user and admin can be logged in.
 * Shows options instead of forcing redirect.
 */
const SmartRedirect = () => {
  const [authState, setAuthState] = useState({
    user: false,
    admin: false,
    checked: false,
  });

  useEffect(() => {
    const adminToken = Cookies.get("adminAccessToken");
    const userToken = localStorage.getItem("userAccessToken");

    setAuthState({
      user: !!userToken,
      admin: !!adminToken,
      checked: true,
    });
  }, []);

  // Show selection page - no forced redirects
  if (!authState.checked) return null;

  return (
    <div className="min-h-screen bg-[#f8f8f8] flex items-center justify-center">
      <div className="bg-white rounded-lg shadow-lg p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <img src="/logo/logo-3.png" width={130} className="mx-auto mb-4" alt="Prospct" />
          <h1 className="text-2xl font-bold text-gray-800">Welcome Back</h1>
          <p className="text-gray-600 mt-2">Choose where you want to go</p>
        </div>

        <div className="space-y-4">
          {authState.user && (
            <Link
              to="/dashboard"
              className="block w-full py-3 px-4 bg-blue-500 text-white rounded-sm text-center hover:bg-blue-600 transition"
            >
              Continue as User →
            </Link>
          )}

          {authState.admin && (
            <Link
              to="/admin/dashboard"
              className="block w-full py-3 px-4 bg-blue-700 text-white rounded-sm text-center hover:bg-blue-800 transition"
            >
              Continue as Admin →
            </Link>
          )}

          {!authState.user && (
            <Link
              to="/login"
              className="block w-full py-3 px-4 border border-blue-500 text-blue-500 rounded-sm text-center hover:bg-blue-50 transition"
            >
              Login as User
            </Link>
          )}

          {!authState.admin && (
            <Link
              to="/admin-login"
              className="block w-full py-3 px-4 border border-blue-700 text-blue-700 rounded-sm text-center hover:bg-blue-50 transition"
            >
              Login as Admin
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default SmartRedirect;
