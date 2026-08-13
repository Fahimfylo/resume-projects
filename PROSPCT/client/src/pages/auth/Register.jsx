/* eslint-disable no-unused-vars */
import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { Link, useNavigate, useLocation } from "react-router-dom";
import LoginSwiperSlider from "../../components/authComponents/LoginSwiperSlider";
import { FaUser } from "react-icons/fa";
import { registerUser } from "../../api/mutation";
import { toast } from "react-toastify";
import BeatLoader from "react-spinners/BeatLoader";
import axios from "axios";
import { parsePhoneNumberFromString, isValidPhoneNumber } from "libphonenumber-js";

import API_CONFIG from "../../utils/apiConstant";
import { GoogleLogin } from "@react-oauth/google";
import useStore from "../../store/store";
import CountrySelector, {
  countries,
} from "../../components/common/header/CountrySelector";

const BASE_URL = API_CONFIG.API_ENDPOINT;

export default function Register() {
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from;

  const { setIsLoggedIn, setUser } = useStore();

  const [step, setStep] = useState(1);

  const [formData, setFormData] = useState({
    email: "",
    alternativeEmail: "",
    company: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
    countryCode: "bd",
  });

  // ===============================
  // ✅ NEW INVITE SYSTEM (relationToken)
  // ===============================
  const searchParams = new URLSearchParams(location.search);
  const relationToken = searchParams.get("relationToken");
  const relationEmail = searchParams.get("relationEmail");

  const isInvited = Boolean(relationToken && relationEmail);

  const [inviteInfo, setInviteInfo] = useState(null);
  const [inviteLoading, setInviteLoading] = useState(isInvited);

  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordErrors, setPasswordErrors] = useState([]);

  const [customTexts, setCustomTexts] = useState({
    loginHeroStat: "200,00+",
    loginSwiperSlides: [],
  });

  // ===============================
  // REGISTER MUTATION
  // ===============================
  const registerMutation = useMutation({
    mutationFn: registerUser,
    onSuccess: (data) => {
      const result = data.data || data;

      if (result.needsVerification && result.tempToken) {
        toast.info("Please verify your email to continue.");
        navigate("/verify-email", {
          state: {
            tempToken: result.tempToken,
            user: result.user,
            isRegistration: true,
            from,
          },
        });
      } else if (result.isMember) {
        // Team member registration - log in directly
        localStorage.setItem("memberAccessToken", result.accessToken);
        document.cookie = `userAccessToken=${result.accessToken}; path=/; max-age=${8 * 24 * 60 * 60}`;
        toast.success(result.message || "Account created successfully");
        navigate(from || "/dashboard");
      } else {
        // Regular success — log in directly
        if (result.accessToken) {
          localStorage.setItem("userAccessToken", result.accessToken);
          document.cookie = `userAccessToken=${result.accessToken}; path=/; max-age=${8 * 24 * 60 * 60}`;
          if (result.user) setUser(result.user);
          setIsLoggedIn(true);
        }
        toast.success(result.message || "Account created successfully");
        navigate(from || "/dashboard");
      }
    },
    onError: (error) => {
      const msg = error.response?.data?.message || "Registration failed";
      toast.error(msg);
      setErrMsg(msg);
    },
  });

  const { isPending } = registerMutation;

  // ===============================
  // VALIDATIONS
  // ===============================
  const isWorkEmail = (email) =>
    /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

  // Password validation with detailed requirements
  const passwordRequirements = [
    { id: 'length', label: 'At least 8 characters', test: (pwd) => pwd.length >= 8 },
    { id: 'uppercase', label: 'At least one uppercase letter (A-Z)', test: (pwd) => /[A-Z]/.test(pwd) },
    { id: 'lowercase', label: 'At least one lowercase letter (a-z)', test: (pwd) => /[a-z]/.test(pwd) },
    { id: 'number', label: 'At least one number (0-9)', test: (pwd) => /\d/.test(pwd) },
  ];

  const getPasswordErrors = (password) => {
    if (!password) return passwordRequirements.map(r => r.id);
    return passwordRequirements.filter(req => !req.test(password)).map(req => req.id);
  };

  const isPasswordValid = (password) => getPasswordErrors(password).length === 0;

  // Validate phone using libphonenumber-js based on selected country
  const isPhoneValid = (phone, countryCode) => {
    if (!phone || phone.trim() === "") return false;
    const country = countries.find((c) => c.code === countryCode);
    const countryPrefix = country ? country.code.toUpperCase() : "BD";

    try {
      return isValidPhoneNumber(phone, countryPrefix);
    } catch {
      return false;
    }
  };

  // Format phone to E.164 format
  const formatPhoneToE164 = (phone, countryCode) => {
    if (!phone || phone.trim() === "") return null;
    const country = countries.find((c) => c.code === countryCode);
    const countryPrefix = country ? country.code.toUpperCase() : "BD";

    try {
      const phoneNumber = parsePhoneNumberFromString(phone, countryPrefix);
      if (phoneNumber && phoneNumber.isValid()) {
        return phoneNumber.format("E.164");
      }
      return null;
    } catch {
      return null;
    }
  };

  // Get validation error message
  const getPhoneValidationError = (phone, countryCode) => {
    if (!phone || phone.trim() === "") {
      return "Phone number is required";
    }
    const country = countries.find((c) => c.code === countryCode);
    const countryName = country ? country.name : "selected country";
    return `Please enter a valid phone number for ${countryName}`;
  };

  // ===============================
  // STEP SYSTEM (YOUR ORIGINAL STYLE PRESERVED)
  // ===============================
  const handleChange = (e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "email" && isWorkEmail(value)) {
      setStep(2);
    } else if (name === "alternativeEmail" && value.trim() !== "") {
      setStep(isInvited ? 4 : 3);
    } else if (name === "company" && value.trim() !== "") {
      setStep(4);
    } else if (name === "firstName" && value.trim() !== "") {
      setStep(5);
    } else if (name === "lastName" && value.trim() !== "") {
      setStep(isInvited ? 7 : 6);
    } else if (name === "password") {
      const errors = getPasswordErrors(value);
      setPasswordErrors(errors);
    } else if (name === "phone") {
      const valid = isPhoneValid(value, formData.countryCode);
      setPhoneError(valid ? "" : getPhoneValidationError(value, formData.countryCode));
      if (valid) {
        setStep(7);
      }
    }
  };

  // ===============================
  // CUSTOM TEXTS (UNCHANGED FEATURE)
  // ===============================
  useEffect(() => {
    const fetchCustomTexts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/api/admin/settings/public`);
        setCustomTexts((prev) => ({ ...prev, ...res.data }));
      } catch (err) {
        // console.error("Failed to fetch custom register texts", err);
      }
    };

    fetchCustomTexts();
  }, []);

  // ===============================
  // INVITE VERIFY (UPDATED ONLY)
  // ===============================
  useEffect(() => {
    if (!isInvited) return;

    const verifyInvite = async () => {
      try {
        const res = await axios.post(`${BASE_URL}/api/invite/verify`, {
          relationToken,
        });

        setInviteInfo(res.data);

        setFormData((prev) => ({
          ...prev,
          email: relationEmail,
          company: res.data.invitedBy?.company || "",
        }));

        setStep(4);
      } catch (err) {
        toast.error("Invalid or expired invite link");
        navigate("/register", { replace: true });
      } finally {
        setInviteLoading(false);
      }
    };

    verifyInvite();
  }, [isInvited, relationToken, relationEmail, navigate]);

  // ===============================
  // SUBMIT
  // ===============================
  const handleSignUp = (e) => {
    e.preventDefault();

    // Validate password before submission
    if (!isPasswordValid(formData.password)) {
      setPasswordErrors(getPasswordErrors(formData.password));
      toast.error("Please meet all password requirements");
      return;
    }

    // Validate phone before submission
    if (!isInvited && !isPhoneValid(formData.phone, formData.countryCode)) {
      setPhoneError(getPhoneValidationError(formData.phone, formData.countryCode));
      toast.error("Please enter a valid phone number");
      return;
    }

    // Format phone to E.164 format
    const formattedPhone = !isInvited
      ? formatPhoneToE164(formData.phone, formData.countryCode)
      : null;

    const selectedCountry = countries.find(
      (c) => c.code === formData.countryCode,
    );

    const dialCode = selectedCountry ? selectedCountry.dial : "+880";

    registerMutation.mutate({
      ...formData,
      phone: formattedPhone || formData.phone,
      countryCode: isInvited ? undefined : dialCode,
      relationToken: relationToken || undefined,
    });
  };

  // ===============================
  // VALIDATION GATE
  // ===============================
  const validateForm = () => {
    const basic =
      isWorkEmail(formData.email) &&
      formData.firstName &&
      formData.lastName &&
      isPasswordValid(formData.password);

    if (isInvited) return basic;

    return basic &&
      formData.company &&
      isPhoneValid(formData.phone, formData.countryCode);
  };

  // ===============================
  // GOOGLE LOGIN (UNCHANGED)
  // ===============================
  const handleGoogleSignIn = async (response) => {
    setLoading(true);
    setErrMsg("");

    try {
      const res = await axios.post(`${BASE_URL}/api/auth/google-auth`, {
        token: response.credential,
        isRegistration: true,
      });

      const { accessToken, user, needsVerification, tempToken } = res.data;

      if (needsVerification && tempToken) {
        toast.info("Please verify your email to complete registration.");
        navigate("/verify-email", { state: { tempToken, user } });
        return;
      }

      localStorage.setItem("userAccessToken", accessToken);
      document.cookie = `userAccessToken=${accessToken}; path=/; max-age=${8 * 24 * 60 * 60}`;
      setUser(user);
      setIsLoggedIn(true);

      toast.success("Welcome back");
      navigate("/dashboard");
    } catch (error) {
      setErrMsg(error.response?.data?.message || "Google sign-in failed");
      toast.error(error.response?.data?.message || "Google sign-in failed");
    } finally {
      setLoading(false);
    }
  };

  // ===============================
  // UI
  // ===============================
  return (
    <div className="lg:flex min-h-screen">
      <div className="h-full lg:w-4/6">
        <div className="px-4 py-4 md:px-12">
          <a href="https://prospct.io">
            <img src="/logo/logo-3.png" width={130} alt="logo" />
          </a>
        </div>

        <div className="flex justify-center pb-8">
          <div className="w-full px-4 sm:w-auto sm:px-0">
            <h1 className="mt-8 text-4xl font-bold">Create a free account</h1>

            {/* Invite UI */}
            {inviteLoading && (
              <div className="p-4 mt-4 bg-blue-50 border rounded">
                <BeatLoader size={8} color="#3b82f6" />
                <span className="ml-2 text-sm">Verifying invite...</span>
              </div>
            )}

            {inviteInfo && !inviteLoading && (
              <div className="p-4 mt-4 bg-green-50 border rounded">
                Invited by <b>{inviteInfo.invitedBy.firstName}</b>
              </div>
            )}

            <form onSubmit={handleSignUp}>
              {/* EMAIL */}
              <label className="block text-sm text-gray-700 py-1 mt-5">
                Enter your Email
              </label>
              <input
                name="email"
                value={formData.email}
                onChange={handleChange}
                readOnly={isInvited}
                className="w-full p-2 border mt-1"
                placeholder="Enter your email"
              />

              {/* ALTERNATIVE EMAIL */}
              {step >= 2 && (
                <>
                  <label className="block text-sm text-gray-700 py-1 mt-4">
                    Alternative Email
                  </label>
                  <input
                    name="alternativeEmail"
                    value={formData.alternativeEmail}
                    onChange={handleChange}
                    className="w-full p-2 border mt-1"
                    placeholder="Enter alternative email (optional)"
                  />
                </>
              )}

              {/* COMPANY */}
              {!isInvited && step >= 3 && (
                <>
                  <label className="block text-sm text-gray-700 py-1 mt-4">
                    Company
                  </label>
                  <input
                    name="company"
                    value={formData.company}
                    onChange={handleChange}
                    className="w-full p-2 border mt-1"
                    placeholder="Enter your company name"
                  />
                </>
              )}

              {/* NAME */}
              {step >= 4 && (
                <div className="flex gap-2 mt-4">
                  <div className="w-full">
                    <label className="block text-sm text-gray-700 py-1 mt-4">
                      First Name
                    </label>
                    <input
                      name="firstName"
                      onChange={handleChange}
                      placeholder="Enter first name"
                      className="w-full border p-2 mt-1"
                    />
                  </div>
                  <div className="w-full">
                    <label className="block text-sm text-gray-700 py-1 mt-4">
                      Last Name
                    </label>
                    <input
                      name="lastName"
                      onChange={handleChange}
                      placeholder="Enter last name"
                      className="w-full border p-2 mt-1"
                    />
                  </div>
                </div>
              )}

              {/* PHONE */}
              {!isInvited && step >= 6 && (
                <>
                  <label className="block text-sm text-gray-700 py-1 mt-4">
                    Phone Number
                  </label>
                  <div className="flex mt-1">
                    <div className="">
                      <CountrySelector
                        value={formData.countryCode}
                        onChange={(code) => {
                          setFormData((prev) => ({ ...prev, countryCode: code }));
                          // Re-validate phone when country changes
                          if (formData.phone) {
                            const valid = isPhoneValid(formData.phone, code);
                            setPhoneError(valid ? "" : getPhoneValidationError(formData.phone, code));
                          }
                        }}
                      />
                    </div>
                    <input
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="Enter phone number"
                      className={`w-full border px-2 ${phoneError ? "border-red-500" : ""}`}
                    />
                  </div>
                  {phoneError && (
                    <p className="mt-1 text-xs text-red-500">{phoneError}</p>
                  )}
                </>
              )}

              {/* PASSWORD */}
              {step >= 7 && (
                <>
                  <label className="block text-sm text-gray-700 py-1 mt-4">
                    Password
                  </label>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Create a password"
                    className={`w-full border p-2 mt-1 ${passwordErrors.length > 0 && formData.password ? 'border-red-300' : formData.password && !passwordErrors.length ? 'border-green-300' : ''}`}
                  />
                  {/* Password Requirements Checklist */}
                  <div className="mt-2 space-y-1">
                    {passwordRequirements.map((req) => {
                      const isMet = !passwordErrors.includes(req.id);
                      return (
                        <div key={req.id} className="flex items-center gap-2 text-xs">
                          <span className={`flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center ${isMet ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-400'}`}>
                            {isMet ? '✓' : '•'}
                          </span>
                          <span className={isMet ? 'text-green-600' : 'text-gray-500'}>
                            {req.label}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}

              <button
                type="submit"
                disabled={!validateForm() || isPending}
                className={`w-full py-2 mt-5 rounded-sm transition duration-300 text-[15px] ${
                  validateForm() && !isPending
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-300 text-white cursor-not-allowed"
                }`}
              >
                {isPending ? "Loading..." : "Sign up"}
              </button>
            </form>
            <div className="py-3 justify-center flex text-sm text-gray-500">
              <p>Or sign up with your work email</p>
            </div>

            <div className="flex justify-center">
              <GoogleLogin onSuccess={handleGoogleSignIn} width="400" />
            </div>
            <div className=" text-[15px] mt-3">
              Already have an account?{" "}
              <Link
                to="/login"
                state={{ from }}
                className="ml-1 text-blue-500 hover:underline"
              >
                Sign In
              </Link>
            </div>
          </div>

        </div>
      </div>

      {/* RIGHT PANEL - Matching Login.jsx Design */}
      <div className="relative py-10 text-center bg-blue-600 lg:w-2/6">
        <div className="px-8 text-center">
          <h2>
            <span className="text-4xl font-bold text-center lg:mt-24 text-gray-50">
              Prospct is trusted by
            </span>
            <br />
            <div className="pt-4">
              <span className="text-center font-bold bg-gradient-to-r from-[#ffd500] to-[#f9f900] bg-clip-text text-transparent text-5xl pt-4">
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
  );
}
