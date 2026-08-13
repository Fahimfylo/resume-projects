import { useState, useRef, useEffect } from "react";
import { AlignJustify, Search, Bell, Settings, CircleUser } from "lucide-react";
import HeaderProfile from "./HeaderProfile";
import NotificationBar from "./NotificationBar";
import { Link, useLocation, useNavigate } from "react-router-dom";
import useStore from "../../../store/store";
import API_CONFIG from "../../../utils/apiConstant";

function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isProfileVisible, setProfileVisible] = useState(false);
  const [isNotificationVisible, setNotificationVisible] = useState(false);
  const [avatarError, setAvatarError] = useState(false);

  const { user, setFilters, notificationPrefs, unreadCount, resetUnread } = useStore();
  const navigate = useNavigate();

  const handleToggleProfile = () => {
    setProfileVisible(!isProfileVisible);
  };

  const handleSearchClick = () => {
    setIsVisible(!isVisible);
  };

  const applySearchFilters = () => {
    if (!searchQuery.trim()) return;

    // Apply the query as a lead name filter and take the user to the search page
    setFilters("personName", searchQuery.trim());
    navigate("/search");
  };

  const handleSearchKeyPress = (event) => {
    if (event.key === "Enter") {
      applySearchFilters();
    }
  };

  useEffect(() => {
    if (user?.profilePicture) setAvatarError(false);
  }, [user?.profilePicture]);

  const handleMenuClick = (event) => {
    event.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const menuRef = useRef(null);
  const menuButtonRef = useRef(null);

  const handleClickOutside = (event) => {
    if (
      menuRef.current &&
      !menuRef.current.contains(event.target) &&
      !menuButtonRef.current.contains(event.target)
    ) {
      setIsMenuOpen(false);
    }
  };

  useEffect(() => {
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const menuData = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/search", label: "Search" },
    { href: "/contacts", label: "Contacts" },
    { href: "/lists", label: "Lists" },
    { href: "/companies", label: "Companies" },
    { href: "/enrich", label: "Enrich" },
    { href: "/verify", label: "Verify" },
  ];

  const location = useLocation();
  const pathname = location.pathname;

  return (
    <>
      <nav className="w-full h-12 flex justify-between items-center py-0 px-4 bg-[#1c2548] text-blue-400 fixed top-0 z-10 sm:z-50">
        <div className="flex items-center">
          <div className="mr-2 text-xl font-bold cursor-pointer xl:ml-4 lg:mr-4">
            <Link to="/dashboard">
              <img src="/logo/logo-3.png" alt="logo" className="w-28" />
            </Link>
          </div>
          <div
            ref={menuRef}
            className={`fixed top-0 w-60 md:w-80 p-4 lg:p-0 right-0 h-full bg-[#1c2548] transition-transform z-[60] ${
              isMenuOpen ? "translate-x-0" : "translate-x-full"
            } lg:-translate-x-0 lg:static lg:flex lg:w-0`}
          >
            <ul className="flex flex-col lg:flex-row">
              {menuData.map(({ href, label }) => (
                <li key={href} className="my-2 lg:my-0 text-[13px]">
                  <Link
                    to={href}
                    className={`block px-4 py-3 rounded-sm transition-colors duration-300 ${
                      pathname === href
                        ? "text-white bg-[#243759] lg:border-b-4 lg:border-b-blue-500"
                        : "text-slate-300"
                    }`}
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <button
            ref={menuButtonRef}
            className="text-gray-100 lg:hidden"
            onClick={handleMenuClick}
          >
            <AlignJustify size={25} className="cursor-pointer" />
          </button>
        </div>

        <div className="flex items-center gap-4">
          <span
            className={`${
              isVisible ? "flex" : "hidden"
            } w-60 bg-white rounded-sm py-1 px-2 border border-blue-500`}
          >
            <span>
              <Search
                size={14}
                className="flex items-center mt-1 text-blue-700 cursor-pointer"
                onClick={applySearchFilters}
              />
            </span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleSearchKeyPress}
              className="pl-4 text-sm placeholder-opacity-50 focus:outline-none focus:border-none"
              placeholder="Type your query"
            />
          </span>
          <Search
            size={23}
            className="text-white cursor-pointer"
            onClick={handleSearchClick}
          />
          <div
            className="relative cursor-pointer"
            onClick={() => {
              resetUnread();
              setNotificationVisible(!isNotificationVisible);
            }}
          >
            <Bell size={23} className="text-white" />
            {/* Red badge — only when bell is enabled and there are unread notifications */}
            {notificationPrefs.inApp?.bell && unreadCount > 0 && (
              <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white flex items-center justify-center font-bold">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </div>
          <Link to="/settings">
            <Settings
              size={23}
              className={`cursor-pointer text-white ${
                pathname === "/settings" ? "text-sky-500" : ""
              }`}
            />
          </Link>

          {user?.profilePicture && !avatarError ? (
            <img
              id="profileButton"
              src={user.profilePicture.startsWith("http") ? user.profilePicture : `${API_CONFIG.API_ENDPOINT}${user.profilePicture}`}
              alt="Profile"
              className="w-[23px] h-[23px] rounded-full cursor-pointer object-cover border border-slate-600"
              onClick={handleToggleProfile}
              onError={() => setAvatarError(true)}
            />
          ) : (
            <CircleUser
              id="profileButton"
              size={23}
              className="text-white cursor-pointer"
              onClick={handleToggleProfile}
            />
          )}
        </div>
      </nav>
      {isProfileVisible && (
        <HeaderProfile setProfileVisible={setProfileVisible} />
      )}

      <NotificationBar
        toggleNotificationBar={setNotificationVisible}
        isNotificationVisible={isNotificationVisible}
      />
    </>
  );
}

export default Header;
