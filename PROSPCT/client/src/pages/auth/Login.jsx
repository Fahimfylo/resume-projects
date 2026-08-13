import LoginSwiperSlider from "../../components/authComponents/LoginSwiperSlider";
import { useState, useEffect } from "react";
import { FaUser } from "react-icons/fa";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { toast } from "react-toastify";
import axios from "axios";
import Cookies from "js-cookie";

import useStore from "../../store/store";
import API_CONFIG from "../../utils/apiConstant";
import { GoogleLogin } from "@react-oauth/google";
import TelegramLogin from "../../components/authComponents/TelegramLogin";
import LinkedinLogin from "../../components/authComponents/LinkedinLogin";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function LoginPage() {
  const { setIsLoggedIn, setUser } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;
  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const [customTexts, setCustomTexts] = useState({
    loginHeroStat: "200,00+",
    loginSwiperSlides: [],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
  };

  useEffect(() => {
    const fetchCustomTexts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/admin/settings/public`);
        setCustomTexts((prev) => ({
          ...prev,
          ...res.data,
        }));
      } catch (err) {
        // console.error("Failed to fetch custom login texts", err);
      }
    };

    fetchCustomTexts();
  }, []);

  // Loading timeout fallback � reset if request takes >30s
  useEffect(() => {
    if (!loading) return;
    const timer = setTimeout(() => {
      setLoading(false);
      setErrorMessage("Request timed out. Please try again.");
      toast.error("Request timed out. Please try again.");
    }, 30000);
    return () => clearTimeout(timer);
  }, [loading]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrorMessage("");

    try {
      const response = await axios.post(`${BASE_URL}/api/auth/login`, formData);

      const { accessToken, user, needsVerification, tempToken } = response.data;

      // Handle unverified user — redirect to OTP verification
      if (needsVerification && tempToken) {
        toast.info("Please verify your email. We've sent a new OTP to your inbox.");
        navigate("/verify-email", { state: { tempToken, user } });
        return;
      }

      if (response.status === 200) {
        // Store user token separately (never overwrites admin token)
        localStorage.setItem("userAccessToken", accessToken);
        document.cookie = `userAccessToken=${accessToken}; path=/; max-age=${8 * 24 * 60 * 60}`;

        setUser(user);
        setIsLoggedIn(true);
        toast.success("Welcome back");
        navigate(from || "/dashboard");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Login failed");
      toast.error(error.response?.data?.message || "Login failed");
      // console.error("Error during login:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async (response) => {
    setLoading(true);
    setErrorMessage("");

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/google-auth`, {
        token: response.credential,
      });

      const { accessToken, user, needsVerification, tempToken } = res.data;

      if (res.status === 200) {
        // New user — redirect to OTP verification page
        if (needsVerification && tempToken) {
          toast.info("Please verify your email to continue.");
          navigate("/verify-email", { state: { tempToken, user } });
          return;
        }

        // Returning verified user — log them straight in
        localStorage.setItem("userAccessToken", accessToken);
        document.cookie = `userAccessToken=${accessToken}; path=/; max-age=${8 * 24 * 60 * 60}`;

        setUser(user);
        setIsLoggedIn(true);
        toast.success("Welcome back");
        navigate("/dashboard");
      }
    } catch (error) {
      setErrorMessage(error.response?.data?.message || "Google sign-in failed");
      toast.error(error.response?.data?.message || "Google sign-in failed");
      // console.error("Error during Google sign-in:", error);
    } finally {
      setLoading(false);
    }
  };

  const isFormValid =
    formData.email.trim() !== "" && formData.password.trim() !== "";

  return (
    <>
      <div className="lg:flex h-[100vh]">
        <div className="bg-[#f8f8f8] h-full lg:w-4/6">
          <div className="px-4 py-4 md:px-12">
            <a href="https://prospct.io">
              <img
                width={130}
                height={50}
                loading="lazy"
                src="/logo/logo-3.png"
                className="mr-4"
                alt="Company logo"
              />
            </a>
          </div>
          <div className="flex justify-center">
            <div className="w-full px-4 sm:w-auto sm:px-0">
              <div className="mt-8 mb-8 text-4xl font-bold text-gray-800 ">
                Welcome to prospct!
              </div>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label
                    htmlFor="email"
                    className="block text-sm text-gray-700"
                  >
                    Email adress
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    placeholder="example@mail.com"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full sm:w-[400px] px-4 py-2 mt-2 text-gray-900 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-sm"
                    required
                  />
                </div>
                <div className="mb-6">
                  <div className="flex justify-between text-sm">
                    <label htmlFor="password" className="block text-gray-700">
                      Password
                    </label>
                    <Link
                      to="/forgot-password"
                      state={{ email: formData.email }}
                      className="text-blue-500 hover:text-blue-600"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <input
                    type="password"
                    id="password"
                    name="password"
                    placeholder="password"
                    value={formData.password}
                    onChange={handleChange}
                    className="w-full sm:w-[400px] px-4 py-2 mt-2 text-gray-900 border border-gray-300 rounded-sm focus:outline-none focus:ring-1 focus:ring-blue-500 placeholder:text-sm"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={!isFormValid}
                  className={`w-full sm:w-[400px] py-2 rounded-sm transition duration-300 text-[15px] ${
                    isFormValid
                      ? "bg-blue-500 text-white hover:bg-blue-600"
                      : "bg-gray-300 text-white cursor-not-allowed"
                  }`}
                >
                  {loading ? "Loading..." : "Login"}
                </button>
              </form>
              <div className="my-4 relative text-xs uppercase tracking-wide font-semibold text-center text-gray-400 before:absolute before:content-[''] before:bg-gray-200 before:w-[calc(100%-220px)] before:h-[1px] before:top-[7px] before:left-0 after:absolute after:content-[''] after:bg-gray-200 after:w-[calc(100%-220px)] after:h-[1px] after:top-[7px] after:right-0">
                or
              </div>
              <div className="relative p-2 overflow-hidden flex mb-2">
                <GoogleLogin
                  onSuccess={handleGoogleSignIn}
                  onError={() => {
                    // console.error("Login Failed");
                  }}
                  shape="pill"
                  useOneTap
                  size="medium"
                  logo_alignment="center"
                />
                <TelegramLogin />
              </div>

              <div className="ml-2 mb-2">
              
              <LinkedinLogin />
              </div>
              {/* Add Telegram widget here */}
              <div className=" text-[15px] mt-3">
                Don&apos;t have account?{" "}
                <Link
                  to="/register"
                  state={{ from }}
                  className="ml-1 text-blue-500 hover:underline"
                >
                  Sign up
                </Link>
              </div>
            </div>
          </div>
        </div>
        <div className="relative py-10 text-center bg-blue-600 lg:w-2/6">
          <div className="px-8 text-center ">
            <h2>
              <span className="text-4xl font-bold text-center lg:mt-24 text-gray-50">
                Prospct is trusted by
              </span>
              <br />
              <div className="pt-4">
                {" "}
                <span className=" text-center font-bold bg-gradient-to-r from-[#ffd500] to-[#f9f900] bg-clip-text text-transparent text-5xl pt-4">
                  {customTexts.loginHeroStat}
                </span>
              </div>
            </h2>
          </div>
          <div className="flex items-center justify-center text-sm">
            <span className="flex items-center justify-center w-20 p-1 mt-3 text-white bg-blue-700 rounded-sm">
              <FaUser size="12" />
              <span className="ml-2">users</span>
            </span>
          </div>
          <div className="mt-8 mb-10 sm:mt-0 xl:mt-8">
            <LoginSwiperSlider slides={customTexts.loginSwiperSlides} />
          </div>
          <div className="absolute bottom-0 flex items-center justify-center w-full">
            <img
              width={150}
              height={70}
              src="/images/review.svg"
              loading="lazy"
              alt="Company logo"
            />
            <img
              width={150}
              height={70}
              src="/images/review.svg"
              loading="lazy"
              alt="Company logo"
            />
          </div>
        </div>
      </div>
    </>
  );
}