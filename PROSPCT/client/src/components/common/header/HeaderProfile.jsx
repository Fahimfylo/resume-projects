import { useState, useRef, useEffect } from "react";
import {
  User,
  BarChart2,
  Info,
  LogOut,
  Plus,
  ChevronRight,
} from "lucide-react";

import useStore from "../../../store/store";
import { logout } from "../../../utils/authServices";
import { Link, useNavigate } from "react-router-dom";
import API_CONFIG from "../../../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

function HeaderProfile({ setProfileVisible }) {
  const { setIsLoggedIn, user, setUser, refreshUser } = useStore();
  const navigate = useNavigate();
  const [isWorkspaceOptionsVisible, setWorkspaceOptionsVisible] =
    useState(false);

  const profileRef = useRef(null);

  // ✅ SAFE DATA EXTRACTION
  const emailCredits = user?.credits?.emailCredits;
  const phoneCredits = user?.credits?.phoneCredits;
  const exportCredits = user?.credits?.exportCredits;
  const verificationCredits = user?.credits?.verificationCredits;
  const plan = user?.plan?.name || "Free Plan";

  const toggleWorkspaceOptions = () => {
    setWorkspaceOptionsVisible(!isWorkspaceOptionsVisible);
  };

  const options = [
    { name: "Account", path: "/settings" },
    { name: "Help & Support", path: "https://prospct.io/help-center-support/" },
  ];

  const handleLogout = async () => {
    try {
      await logout();
      setIsLoggedIn(false);
      setUser(null);
      navigate("/login");
    } catch (error) {
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        profileRef.current &&
        !profileRef.current.contains(event.target) &&
        !event.target.closest("#profileButton")
      ) {
        setProfileVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [setProfileVisible]);

  // Fetch user data including credits when profile opens
  useEffect(() => {
    refreshUser();
  }, []);

  // ✅ Prevent crash before user loads
  if (!user) {
    return (
      <section className="fixed z-50 top-14 md:right-0 bottom-0 h-[460px] w-64 bg-white flex items-center justify-center shadow-lg border border-gray-300 rounded-md">
        <div className="text-sm text-gray-500">Loading...</div>
      </section>
    );
  }

  return (
    <section
      ref={profileRef}
      id="profile-section"
      className="fixed z-50 top-14 md:right-0 bottom-0 h-[500px] w-64 bg-white text-gray-700 flex flex-col rounded-md shadow-lg transition-transform duration-300 ease-out border border-gray-300"
    >
      {/* Workspace Options Popup */}
      <div
        id="profile-switch-workspace-options"
        className={`absolute top-64 right-64 w-48 h-40 z-50 bg-white rounded-md shadow-md ${
          isWorkspaceOptionsVisible ? "" : "hidden"
        }`}
      >
        <div
          className="flex items-center justify-between h-12 p-4 cursor-pointer hover:bg-gray-100"
          onClick={toggleWorkspaceOptions}
        >
          <div className="font-semibold text-blue-500">All Workspaces</div>
        </div>

        <div className="flex items-center justify-between h-12 p-4 cursor-pointer hover:bg-gray-100">
          <div>
            {user?.firstName} {user?.lastName}
          </div>
        </div>

        <div
          className="flex items-center justify-between h-12 p-4 cursor-pointer hover:bg-gray-100"
          onClick={() => navigate("/settings/teams")}
        >
          <div className="flex items-center text-blue-500">
            <Plus className="mr-2 text-sm" />
            Add workspaces
          </div>
        </div>
      </div>

      {/* Credits Section */}
      <div className="px-5 pt-5 pb-2 bg-gray-100 profile-section-inner rounded-b-md border-b border-gray-300">
        <div className="flex justify-between mb-2">
          <div>{plan}</div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between mb-1 text-xs">
            <p>Phone credits</p>
            <p className="font-semibold text-blue-500">
              {Math.max(0, (emailCredits?.max || 0) - (emailCredits?.current || 0))} / {emailCredits?.current || 0}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between mb-1 text-xs">
            <p>Email Credits</p>
            <p className="font-semibold text-blue-500">
              {Math.max(0, (phoneCredits?.max || 0) - (phoneCredits?.current || 0))} / {phoneCredits?.current || 0}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between mb-1 text-xs">
            <p>Export credits</p>
            <p className="font-semibold text-blue-500">
              {Math.max(0, (exportCredits?.max || 0) - (exportCredits?.current || 0))} / {exportCredits?.current || 0}
            </p>
          </div>
        </div>

        <div className="mb-3">
          <div className="flex justify-between mb-1 text-xs">
            <p>Email Verification Credits</p>
            <p className="font-semibold text-blue-500">
              {Math.max(0, (verificationCredits?.max || 0) - (verificationCredits?.current || 0))} / {verificationCredits?.current || 0}
            </p>
          </div>
        </div>
        <button
          className="w-full py-1 text-sm text-white bg-blue-500 rounded-sm hover:bg-blue-600"
          onClick={() => navigate("/plans-and-billings")}
        >
          See plans
        </button>
      </div>

      {/* Menu Section */}
      <div className="pt-0">
        <div
          className="flex items-center justify-between px-5 py-4 bg-white border-t border-gray-200 cursor-pointer hover:bg-gray-100"
          onClick={toggleWorkspaceOptions}
        >
          <div>
            <div className="flex justify-between mb-1 text-xs">
              Create or switch workspaces
            </div>
            <div className="font-semibold">
              {user?.firstName} {user?.lastName}
            </div>
          </div>
          <ChevronRight className="text-gray-400" />
        </div>

        {options.map((option, index) => (
          <Link
            key={index}
            to={option.path}
            className="flex items-center justify-between px-5 py-3 text-sm bg-white border-t border-gray-200 cursor-pointer hover:bg-gray-100"
          >
            <div className="flex items-center">
              {getIcon(option.name)}
              {option.name}
            </div>
          </Link>
        ))}

        <div
          className="flex items-center justify-between px-5 py-3 text-sm bg-white border-t border-gray-200 cursor-pointer hover:bg-gray-100"
          onClick={handleLogout}
        >
          <p className="flex items-center">
            {getIcon("Log out")}
            Log Out
          </p>
        </div>
      </div>
    </section>
  );
}

function getIcon(option) {
  const icons = {
    Account: <User className="mr-2 text-sm text-gray-400" />,
    Usage: <BarChart2 className="mr-2 text-sm text-gray-400" />,
    "Help & Support": <Info className="mr-2 text-sm text-gray-400" />,
    "Log out": <LogOut className="mr-2 text-sm text-gray-400" />,
  };

  return icons[option] || null;
}

export default HeaderProfile;
