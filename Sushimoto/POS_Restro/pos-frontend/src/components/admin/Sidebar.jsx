import { useNavigate, useLocation } from "react-router-dom";
import { useSelector, useDispatch } from "react-redux";
import {
  MdDashboard, MdOutlineReorder, MdTableBar, MdRestaurantMenu,
  MdPeople, MdPayments, MdGroup, MdPerson, MdHome,
  MdChevronLeft, MdLogout, MdFastfood,
} from "react-icons/md";
import { useMutation } from "@tanstack/react-query";
import { logout as logoutApi } from "../../https";
import { removeUser } from "../../redux/slices/userSlice";

const navMap = {
  superadmin: [
    { label: "Dashboard", icon: <MdDashboard />, path: "/dashboard" },
    { label: "Orders", icon: <MdOutlineReorder />, path: "/dashboard/orders" },
    { label: "Tables", icon: <MdTableBar />, path: "/dashboard/tables" },
    { label: "Menu", icon: <MdFastfood />, path: "/dashboard/menu" },
    { label: "Categories", icon: <MdRestaurantMenu />, path: "/dashboard/items" },
    { label: "Food Items", icon: <MdRestaurantMenu />, path: "/dashboard/items/foods" },
    { label: "Users", icon: <MdPeople />, path: "/dashboard/users" },
    { label: "Payments", icon: <MdPayments />, path: "/dashboard/payments" },
    { label: "Staff", icon: <MdGroup />, path: "/dashboard/staff" },
    { label: "Profile", icon: <MdPerson />, path: "/dashboard/profile" },
  ],
  admin: [
    { label: "Dashboard", icon: <MdDashboard />, path: "/dashboard" },
    { label: "Orders", icon: <MdOutlineReorder />, path: "/dashboard/orders" },
    { label: "Tables", icon: <MdTableBar />, path: "/dashboard/tables" },
    { label: "Menu", icon: <MdFastfood />, path: "/dashboard/menu" },
    { label: "Categories", icon: <MdRestaurantMenu />, path: "/dashboard/items" },
    { label: "Food Items", icon: <MdRestaurantMenu />, path: "/dashboard/items/foods" },
    { label: "Users", icon: <MdPeople />, path: "/dashboard/users" },
    { label: "Payments", icon: <MdPayments />, path: "/dashboard/payments" },
    { label: "Staff", icon: <MdGroup />, path: "/dashboard/staff" },
    { label: "Profile", icon: <MdPerson />, path: "/dashboard/profile" },
  ],
  waiter: [
    { label: "Dashboard", icon: <MdDashboard />, path: "/dashboard" },
    { label: "Orders", icon: <MdOutlineReorder />, path: "/dashboard/orders" },
    { label: "Tables", icon: <MdTableBar />, path: "/dashboard/tables" },
    { label: "Menu", icon: <MdFastfood />, path: "/dashboard/menu" },
    { label: "Categories", icon: <MdRestaurantMenu />, path: "/dashboard/items" },
    { label: "Food Items", icon: <MdRestaurantMenu />, path: "/dashboard/items/foods" },
    { label: "Users", icon: <MdPeople />, path: "/dashboard/users" },
    { label: "Staff", icon: <MdGroup />, path: "/dashboard/staff" },
    { label: "Profile", icon: <MdPerson />, path: "/dashboard/profile" },
  ],
};

export default function Sidebar({ collapsed, onToggle }) {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { role, name } = useSelector((state) => state.user);

  const navItems = navMap[role?.toLowerCase()] || navMap.admin;

  const logoutMutation = useMutation({
    mutationFn: () => logoutApi(),
    onSuccess: () => {
      dispatch(removeUser());
      navigate("/auth");
    },
  });

  return (
    <aside
      className={`fixed left-0 top-0 h-screen z-50 flex flex-col transition-all duration-300 ${
        collapsed ? "w-20" : "w-64"
      }`}
    >
      {/* Glass background — matches sushi navbar */}
      <div className="absolute inset-0 bg-white/15 backdrop-blur-[20px] saturate-[180%] border-r border-black/6" />

      {/* Content */}
      <div className="relative flex flex-col h-full">
        {/* Logo */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-black/6">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-white text-sm font-bold flex-none">
              S
            </div>
            {!collapsed && (
              <h1 className="text-lg font-heading font-bold tracking-wide text-secondary">
                <span className="text-primary">Sushi</span>moto
              </h1>
            )}
          </div>
          <button
            onClick={onToggle}
            className="text-muted-foreground hover:text-secondary transition-colors p-1 rounded-lg hover:bg-black/5"
          >
            <MdChevronLeft className={`text-lg transition-transform duration-300 ${collapsed ? "rotate-180" : ""}`} />
          </button>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto px-3 py-5 space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm font-body transition-all duration-200 ${
                  isActive
                    ? "bg-primary text-white shadow-md"
                    : "text-muted-foreground hover:text-secondary hover:bg-white/20"
                }`}
                title={collapsed ? item.label : undefined}
              >
                <span className="text-xl flex-none">{item.icon}</span>
                {!collapsed && <span className="font-medium">{item.label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User footer */}
        <div className="border-t border-black/6 px-3 py-3">
          {!collapsed && (
            <div className="flex items-center gap-3 mb-2 px-2 py-2 rounded-xl hover:bg-black/5 transition-colors cursor-pointer" onClick={() => navigate("/dashboard/profile")}>
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold flex-none">
                {name?.[0]?.toUpperCase() || "U"}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-secondary truncate">{name || "User"}</p>
                <p className="text-xs text-muted-foreground capitalize">{role || "Role"}</p>
              </div>
            </div>
          )}
          <button
            onClick={() => logoutMutation.mutate()}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-sm text-muted-foreground hover:text-red-500 hover:bg-red-50 transition-all duration-200"
          >
            <MdLogout className="text-lg flex-none" />
            {!collapsed && <span className="font-medium">Sign Out</span>}
          </button>
        </div>
      </div>
    </aside>
  );
}
