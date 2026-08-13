import PropTypes from "prop-types";
import { Image, UploadCloud, Loader2, ShieldCheck } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import {
  updateUserProfile,
  uploadProfilePicture,
  deleteUserAccount,
} from "../../../api/mutation";
import useStore from "../../../store/store";
import API_CONFIG from "../../../utils/apiConstant";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";
import CountrySelector from "./CountrySelector";
import { countries } from "./CountrySelector";

const Profile = ({ formData, onInputChange, onSubmit, userId }) => {
  const { user, setUser } = useStore();
  const resolvedUserId = userId || user?._id;
  const fileInputRef = useRef(null);

  const [loading, setLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [deleteConfirmationPending, setDeleteConfirmationPending] =
    useState(false);
  const [countryCode, setCountryCode] = useState("bd");
  const [altEmailInput, setAltEmailInput] = useState("");
  const [addingAltEmail, setAddingAltEmail] = useState(false);

  const alternativeEmails = formData.alternativeEmails || [];

  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const profilePicUrl = user?.profilePicture || "";

  // Extract country code from user's phone or default to 'bd'
  useEffect(() => {
    if (user?.profilePicture) setImageError(false);

    // If user has a phone number in E.164 format, extract country code
    if (user?.phone) {
      const phone = user.phone;
      // Find matching country by dial code
      const dialCode = phone.match(/^\+\d+/)?.[0];
      const matchingCountry = countries.find((c) => c.dial === dialCode);
      if (matchingCountry) {
        setCountryCode(matchingCountry.code.toLowerCase());
      }
    }
  }, [user?.profilePicture, user?.phone]);

  const inputStyle =
    "w-full h-11 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200";

  const labelStyle =
    "text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5 block";

  // Reusable Small Primary Button Class
  const primaryBtnSm =
    "relative flex items-center justify-center gap-2 px-5 h-9 rounded-lg bg-blue-600 text-white text-xs font-bold hover:bg-blue-700 active:scale-[0.98] disabled:bg-blue-400 transition-all shadow-md shadow-blue-200";

  // Reusable Small Secondary Button Class
  const secondaryBtnSm =
    "px-4 h-9 rounded-lg border border-gray-200 text-xs font-medium text-gray-600 hover:bg-gray-50:bg-slate-800 active:scale-[0.98] transition-all";

  const handleDeleteAccount = async () => {
    // First click: Show confirmation toast
    if (!deleteConfirmationPending) {
      setDeleteConfirmationPending(true);
      toast.warning(
        "Are you absolutely sure? This action cannot be undone. Your account and all associated data will be permanently deleted.",
        {
          position: "top-right",
          autoClose: false,
          closeButton: true,
        },
      );
      return;
    }

    // Second click: Proceed with deletion
    setLoading(true);
    try {
      await deleteUserAccount(resolvedUserId);
      toast.success("Account deleted successfully", {
        position: "top-right",
        autoClose: 3000,
      });
      // Clear local storage and redirect to login
      localStorage.removeItem("accessToken");
      localStorage.removeItem("user");
      localStorage.removeItem("savedContactsCache");
      window.location.href = "/login";
    } catch (error) {
      setDeleteConfirmationPending(false);
      toast.error(error.response?.data?.message || "Failed to delete account", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Get the dial code from the selected country
      const selectedCountry = countries.find((c) => c.code === countryCode);
      const dialCode = selectedCountry ? selectedCountry.dial : "+880";

      await updateUserProfile(resolvedUserId, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        countryCode: dialCode,
        phone: formData.phoneNumber || "",
        alternativeEmails: alternativeEmails,
      });

      toast.success("Profile saved successfully", {
        position: "top-right",
        autoClose: 3000,
      });
      onSubmit?.(e);
    } catch {
      toast.error("Could not update profile", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpload = async (file) => {
    if (!file) return;

    setIsUploading(true);
    try {
      const res = await uploadProfilePicture(file, resolvedUserId);
      if (res.user) setUser(res.user);

      toast.success("Profile picture updated", {
        position: "top-right",
        autoClose: 3000,
      });
    } catch {
      toast.error("Upload failed. Try again.", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setIsUploading(false);
    }
  };

  const handlePasswordUpdate = async (e) => {
    e.preventDefault();

    if (!passwordData.currentPassword || passwordData.newPassword.length < 6) {
      toast.error("Password must be at least 6 characters", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error("Passwords do not match", {
        position: "top-right",
        autoClose: 3000,
      });
      return;
    }

    setLoading(true);
    try {
      await updateUserProfile(resolvedUserId, {
        password: passwordData.newPassword,
      });

      toast.success("Password changed successfully", {
        position: "top-right",
        autoClose: 3000,
      });
      setShowPasswordForm(false);
      setPasswordData({
        currentPassword: "",
        newPassword: "",
        confirmPassword: "",
      });
    } catch {
      toast.error("Security update failed", {
        position: "top-right",
        autoClose: 3000,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAltEmail = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const trimmed = altEmailInput.trim();
    if (!trimmed) return;
    if (!emailRegex.test(trimmed)) {
      toast.error("Please enter a valid email address");
      return;
    }
    if (trimmed.toLowerCase() === formData.email.toLowerCase()) {
      toast.error("Alternative email cannot be the same as your work email");
      return;
    }
    if (
      alternativeEmails.some((e) => e.toLowerCase() === trimmed.toLowerCase())
    ) {
      toast.error("This email is already added");
      return;
    }
    if (alternativeEmails.length >= 1) {
      toast.error("Maximum 1 alternative email allowed");
      return;
    }
    setAddingAltEmail(true);
    setTimeout(() => {
      onInputChange({
        target: {
          name: "alternativeEmails",
          value: [...alternativeEmails, trimmed],
        },
      });
      setAltEmailInput("");
      setAddingAltEmail(false);
    }, 300);
  };

  const handleRemoveAltEmail = (emailToRemove) => {
    const updated = alternativeEmails.filter((e) => e !== emailToRemove);
    onInputChange({ target: { name: "alternativeEmails", value: updated } });
  };

  return (
    <div className="m-5 space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      {/* PROFILE CARD */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-gray-200/50 transition-colors">
        <header className="flex flex-col gap-1 mb-8">
          <h2 className="text-2xl font-bold text-gray-900">
            Personal Information
          </h2>
          <p className="text-gray-500 text-sm">
            Manage your profile details and avatar.
          </p>
        </header>

        {/* AVATAR SECTION */}
        <div className="flex items-center gap-6 mb-10 group">
          <div className="relative">
            <div
              className={`w-24 h-24 rounded-full overflow-hidden border-4 border-white shadow-md ring-1 ring-gray-100 transition-opacity ${isUploading ? "opacity-50" : "opacity-100"}`}
            >
              {profilePicUrl && !imageError ? (
                <img
                  src={`${profilePicUrl.startsWith("http") ? profilePicUrl : API_CONFIG.API_ENDPOINT + profilePicUrl}?t=${Date.now()}`}
                  className="w-full h-full object-cover"
                  onError={() => setImageError(true)}
                  alt="Avatar"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100">
                  <Image className="text-gray-300" size={32} />
                </div>
              )}
            </div>

            <button
              onClick={() => fileInputRef.current.click()}
              className="absolute -bottom-1 -right-1 p-2 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 hover:scale-110 active:scale-95 transition-all"
            >
              <UploadCloud size={14} />
            </button>

            {isUploading && (
              <div className="absolute inset-0 flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={28} />
              </div>
            )}
          </div>

          <div className="space-y-1">
            <h4 className="font-semibold text-gray-800">Profile Photo</h4>
            <p className="text-xs text-gray-400 max-w-[180px]">
              JPG, GIF or PNG. Max size 2MB.
            </p>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={(e) => handleUpload(e.target.files[0])}
            />
          </div>
        </div>

        {/* FORM */}
        <form
          onSubmit={handleProfileUpdate}
          className="grid grid-cols-1 md:grid-cols-2 gap-6"
        >
          <div className="space-y-1">
            <label className={labelStyle}>First Name</label>
            <input
              className={inputStyle}
              name="firstName"
              value={formData.firstName}
              onChange={onInputChange}
              placeholder="John"
            />
          </div>
          <div className="space-y-1">
            <label className={labelStyle}>Last Name</label>
            <input
              className={inputStyle}
              name="lastName"
              value={formData.lastName}
              onChange={onInputChange}
              placeholder="Doe"
            />
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className={labelStyle}>Email Address</label>
            <input
              className={inputStyle}
              type="email"
              name="email"
              value={formData.email}
              onChange={onInputChange}
              placeholder="john@example.com"
            />
          </div>
          {/* Alternative Email Section */}
          <div className="md:col-span-2 space-y-2">
            <label className={labelStyle}>Alternative Email</label>
            <p className="text-xs text-gray-400 -mt-2">
              Add 1 backup email for account recovery. You can use it to
              reset your password.
            </p>

            {/* Existing alternative emails */}
            {alternativeEmails.length > 0 && (
              <div className="space-y-2">
                {alternativeEmails.map((altEmail) => (
                  <div
                    key={altEmail}
                    className="flex items-center justify-between h-10 px-3 rounded-lg bg-gray-50 border border-gray-200"
                  >
                    <div className="flex items-center gap-2 min-w-0">
                      <svg
                        className="w-4 h-4 text-gray-400 flex-shrink-0"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.5"
                          d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                        />
                      </svg>
                      <span className="text-sm text-gray-700 truncate">
                        {altEmail}
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveAltEmail(altEmail)}
                      className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 rounded transition-colors flex-shrink-0"
                    >
                      <svg
                        className="w-4 h-4"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M6 18L18 6M6 6l12 12"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Add new alternative email */}
            {alternativeEmails.length < 1 && (
              <div className="flex items-center gap-2">
                <input
                  type="email"
                  value={altEmailInput}
                  onChange={(e) => setAltEmailInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      handleAddAltEmail();
                    }
                  }}
                  placeholder="backup@example.com"
                  className="flex-1 h-11 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                />
                <button
                  type="button"
                  onClick={handleAddAltEmail}
                  disabled={addingAltEmail || !altEmailInput.trim()}
                  className="h-11 px-4 rounded-xl bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors flex-shrink-0"
                >
                  {addingAltEmail ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    "Add"
                  )}
                </button>
              </div>
            )}
          </div>
          <div className="md:col-span-2 space-y-1">
            <label className={labelStyle}>Phone Number</label>
            <div className="flex items-center gap-2">
              <CountrySelector
                value={countryCode}
                onChange={(code) => {
                  setCountryCode(code);
                }}
              />
              <input
                className="flex-1 h-11 rounded-xl border border-gray-200 bg-gray-50/50 px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all duration-200"
                name="phoneNumber"
                value={formData.phoneNumber || ""}
                onChange={onInputChange}
                placeholder="Phone number"
                type="tel"
              />
            </div>
          </div>

          <div className="md:col-span-2 flex items-center gap-3 pt-6 border-t border-gray-50 mt-2">
            <button type="submit" disabled={loading} className={primaryBtnSm}>
              {loading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                "Save Changes"
              )}
            </button>
            <button type="button" className={secondaryBtnSm}>
              Discard
            </button>
          </div>
        </form>
      </div>

      {/* SECURITY CARD */}
      <div className="bg-white border border-gray-100 rounded-3xl p-8 shadow-xl shadow-gray-200/50">
        <div
          className="flex justify-between items-center cursor-pointer group"
          onClick={() => setShowPasswordForm(!showPasswordForm)}
        >
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <ShieldCheck size={20} />
            </div>
            <div>
              <h3 className="font-bold text-gray-900">Security</h3>
              <p className="text-xs text-gray-500">
                Manage password and authentication.
              </p>
            </div>
          </div>
          <button className="text-blue-600 text-xs font-bold bg-blue-50 px-3 py-1.5 rounded-lg group-hover:bg-blue-100 transition-colors">
            {showPasswordForm ? "Hide" : "Update"}
          </button>
        </div>

        {showPasswordForm && (
          <form
            onSubmit={handlePasswordUpdate}
            className="mt-8 space-y-5 animate-in slide-in-from-top-2 duration-300"
          >
            <div className="space-y-1">
              <div className="flex justify-between items-center">
                <label className={labelStyle}>Current Password</label>
                <Link
                  to="/forgot-password"
                  state={{ email: user?.email || "" }}
                  className="text-xs text-blue-600 hover:text-blue-700 font-medium"
                >
                  Forgot Password?
                </Link>
              </div>
              <input
                className={inputStyle}
                type="password"
                required
                onChange={(e) =>
                  setPasswordData({
                    ...passwordData,
                    currentPassword: e.target.value,
                  })
                }
              />
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <label className={labelStyle}>New Password</label>
                <input
                  className={inputStyle}
                  type="password"
                  required
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      newPassword: e.target.value,
                    })
                  }
                />
              </div>
              <div className="space-y-1">
                <label className={labelStyle}>Confirm Password</label>
                <input
                  className={inputStyle}
                  type="password"
                  required
                  onChange={(e) =>
                    setPasswordData({
                      ...passwordData,
                      confirmPassword: e.target.value,
                    })
                  }
                />
              </div>
            </div>
            <button type="submit" disabled={loading} className={primaryBtnSm}>
              {loading ? (
                <Loader2 className="animate-spin" size={14} />
              ) : (
                "Update Security Credentials"
              )}
            </button>
          </form>
        )}
      </div>

      {/* DANGER ZONE */}
      <div className="bg-red-50/30 border border-red-100 rounded-3xl p-8">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-red-700 font-bold">Danger Zone</h3>
            <p className="text-sm text-red-600/70">
              Once you delete your account, there is no going back.
            </p>
          </div>
          <button
            onClick={handleDeleteAccount}
            disabled={loading}
            className="px-4 h-10 rounded-lg text-xs font-semibold transition-all duration-200 flex items-center gap-2
            border border-red-300 text-red-600 hover:text-white bg-white
           hover:bg-red-500 hover:border-red-300
            active:scale-[0.98]
            disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-white"
          >
            {loading ? (
              <>
                <Loader2 size={14} className="animate-spin" />
                Deleting account...
              </>
            ) : deleteConfirmationPending ? (
              <>
                <span className="hover:text-white font-medium">
                  Confirm deletion
                </span>
              </>
            ) : (
              "Delete account"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

Profile.propTypes = {
  formData: PropTypes.object.isRequired,
  onInputChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func,
  userId: PropTypes.string,
};

export default Profile;
