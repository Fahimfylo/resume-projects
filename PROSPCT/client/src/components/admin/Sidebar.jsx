import {
  FaDashcube,
  FaCaretDown,
  FaPaperPlane,
  FaTicket,
  FaUserShield,
} from "react-icons/fa6";
import { IoSettingsSharp } from "react-icons/io5";
import { MdSubscriptions } from "react-icons/md";
import { GrTransaction } from "react-icons/gr";
import { Link } from "react-router-dom";
import { useState } from "react";
import { FaUserFriends, FaFileImport, FaGift } from "react-icons/fa";

export default function Sidebar({ isExpanded, sidebarDivRef, expandSidebar }) {
  const [activeMenu, setActiveMenu] = useState(null);

  const toggleMenu = (menu) => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const menuItems = [
    {
      icon: <FaDashcube />,
      label: "Dashboard",
      key: "dashboard",
      link: "/admin/dashboard",
      hasSubmenu: false,
    },
    {
      icon: <FaUserFriends />,
      label: "Users",
      key: "users",
      link: "/admin/users",
      hasSubmenu: true,
      submenuLinks: [
        { label: "User List", link: "/admin/users" },
        { label: "Teams", link: "/admin/users/teams" },
        { label: "Add User", link: "/admin/users/add" },
      ],
    },

    {
      icon: <FaPaperPlane />,
      label: "Plans",
      key: "Plans",
      link: "/admin/plans",
      hasSubmenu: true,
      submenuLinks: [
        { label: "Plans List", link: "/admin/plans" },
        { label: "Custom Plans", link: "/admin/custom-plans" },
        { label: "Add Plan", link: "/admin/plans/add" },
      ],
    },
    {
      icon: <MdSubscriptions />,
      label: "Subscriptions",
      key: "Subscriptions",
      link: "/admin/subscriptions",
      hasSubmenu: true,
      submenuLinks: [
        { label: "Subscription List", link: "/admin/subscriptions" },
        { label: "Add Subscription", link: "/admin/subscriptions/add" },
      ],
    },
    {
      icon: <GrTransaction />,
      label: "Transactions",
      key: "Transactions",
      link: "/admin/transactions",
      hasSubmenu: true,
      submenuLinks: [
        { label: "Transaction List", link: "/admin/transactions" },
        { label: "Add Transaction", link: "/admin/transactions/add" },
      ],
    },

    {
      icon: <FaTicket />,
      label: "Coupons",
      key: "Coupons",
      link: "/admin/coupons",
      hasSubmenu: true,
      submenuLinks: [
        { label: "Coupon List", link: "/admin/coupons" },
        { label: "Add Coupon", link: "/admin/coupons/add" },
      ],
    },
    {
      icon: <FaGift />,
      label: "Special Deals",
      key: "SpecialDeals",
      link: "/admin/special-deals",
      hasSubmenu: true,
      submenuLinks: [
        { label: "Deal List", link: "/admin/special-deals" },
        { label: "Add Deal", link: "/admin/special-deals/add" },
        { label: "Redemption Requests", link: "/admin/special-deals/requests" },
        { label: "Voucher Requests", link: "/admin/special-deals/voucher-requests" },
        { label: "Assigned", link: "/admin/special-deals/assigned" },
      ],
    },
    {
      icon: <FaFileImport />,
      label: "Import Data",
      key: "import",
      link: "/admin/import",
      hasSubmenu: false,
    },
    {
      icon: <FaUserShield />,
      label: "Admins",
      key: "Admins",
      link: "/admin/admins",
      hasSubmenu: true,
      submenuLinks: [
        { label: "Admin List", link: "/admin/admins" },
        { label: "Add Admin", link: "/admin/admins/add" },
      ],
    },
    {
      icon: <IoSettingsSharp />,
      label: "Settings",
      key: "Settings",
      link: "/admin/settings",
      hasSubmenu: true,
      submenuLinks: [{ label: "Settings", link: "/admin/settings" },{ label: "Checkout Layout", link: "/admin/layout" }],
    },
  ];

  return (
    <section
      ref={sidebarDivRef}
      id="dashboard-sidebar"
      className={`text-sm py-4 border-r bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 fixed top-0 left-0 flex-col flex-shrink-0 pt-[70px] h-full duration-300 lg:flex transition-all z-30 overflow-y-auto overflow-x-hidden no-scrollbar ${
        isExpanded ? "w-[220px] translate-x-0" : "w-[80px] translate-x-0"
      } ${!isExpanded ? "max-lg:-translate-x-full" : "max-lg:translate-x-0"}`}
    >
      <ul id="dashboard">
        {menuItems.map((item) => (
          <li
            key={item.key}
            className={`mt-1 ${isExpanded ? "w-44" : "w-44 lg:w-12"} pt-2`}
          >
            {/* Render main Link only if there's no submenu */}
            {!item.hasSubmenu ? (
              <Link to={item.link} onClick={() => !isExpanded && expandSidebar()}>
                <div className="flex items-center cursor-pointer py-2.5 px-3 justify-between hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group">
                  <div className="flex items-center">
                    <span className={`flex text-sm h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm`}>
                      {item.icon}
                    </span>
                    <span
                      className={`ml-3 font-semibold whitespace-nowrap transition-opacity duration-300 ${isExpanded ? "opacity-100" : "lg:opacity-0 w-0 overflow-hidden"}`}
                    >
                      {item.label}
                    </span>
                  </div>
                </div>
              </Link>
            ) : (
              <div
                onClick={() => {
                  if (!isExpanded) {
                    expandSidebar();
                  }
                  toggleMenu(item.key);
                }}
                className="flex items-center cursor-pointer py-2.5 px-3 justify-between hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-all duration-200 group"
              >
                <div className="flex items-center">
                  <span className={`flex text-sm h-10 w-10 items-center justify-center rounded-xl bg-slate-100 dark:bg-slate-800 p-2 text-slate-600 dark:text-slate-300 group-hover:bg-indigo-500 group-hover:text-white transition-all shadow-sm`}>
                    {item.icon}
                  </span>
                  <span
                    className={`ml-3 font-semibold whitespace-nowrap transition-opacity duration-300 ${isExpanded ? "opacity-100" : "lg:opacity-0 w-0 overflow-hidden"}`}
                  >
                    {item.label}
                  </span>
                </div>
                {item.hasSubmenu && isExpanded && (
                  <span className="text-slate-400 group-hover:text-indigo-500 transition-colors">
                    <FaCaretDown className={`transition-transform duration-300 ${activeMenu === item.key ? "rotate-180" : ""}`} />
                  </span>
                )}
              </div>
            )}
            {/* Render submenu links if available */}
            {item.hasSubmenu && (
              <div
                className={`${activeMenu === item.key ? "block" : "hidden"} transition-height duration-500`}
              >
                <ul>
                  {item.submenuLinks &&
                    item.submenuLinks.map((submenuItem, index) => (
                      <li key={index}>
                        <Link to={submenuItem.link}>
                          <div className={`flex w-full cursor-pointer items-center py-2 pl-12 pr-4 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500 dark:text-slate-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-all font-medium text-xs`}>
                            {submenuItem.label}
                          </div>
                        </Link>
                      </li>
                    ))}
                </ul>
              </div>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}
