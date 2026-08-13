// src/pages/JoinTeam/JoinTeam.jsx
import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../../utils/apiConstant";
import { toast } from "react-toastify";

const JoinTeam = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState("processing");

  useEffect(() => {
    const processJoin = async () => {
      const authToken = Cookies.get("userAccessToken");

      if (!authToken) {
        toast.error("Please login or create an account to join the team.");
        // Save the intended destination so they return here after login
        navigate("/login", { state: { from: `/team/join/${token}` } });
        return;
      }

      try {
        const res = await axios.post(
          `${API_CONFIG.API_ENDPOINT}/api/team/join/${token}`,
          {},
          {
            headers: { Authorization: `Bearer ${authToken}` },
          },
        );
        toast.success("Successfully joined the team! ✅");
        navigate("/dashboard");
      } catch (err) {
        const msg = err.response?.data?.error || "Failed to join team";
        toast.error(msg);
        setStatus("error");
        setTimeout(() => navigate("/dashboard"), 3000);
      }
    };

    processJoin();
  }, [token, navigate]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white shadow-md rounded-lg text-center">
        {status === "processing" ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">
              Joining Team...
            </h2>
            <p className="text-gray-500 mt-2">
              Verifying your invitation, please wait.
            </p>
          </>
        ) : (
          <h2 className="text-xl font-semibold text-red-500">
            Something went wrong
          </h2>
        )}
      </div>
    </div>
  );
};

export default JoinTeam;
