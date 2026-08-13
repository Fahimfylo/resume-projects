import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { MdOutlineReorder, MdRestaurantMenu, MdPeople, MdTableBar, MdShoppingCart, MdFastfood, MdArrowForward } from "react-icons/md";
import { useNavigate } from "react-router-dom";
import { axiosWrapper } from "../../https/axiosWrapper";
import { getOrders, getTables } from "../../https";

const cardColors = [
  { bg: "#b1454a", label: "Total Orders", icon: <MdOutlineReorder className="text-3xl" />, key: "orders" },
  { bg: "#1f1e31", label: "Total Categories", icon: <MdRestaurantMenu className="text-3xl" />, key: "categories" },
  { bg: "#6a1b9a", label: "Total Items", icon: <MdFastfood className="text-3xl" />, key: "items" },
  { bg: "#5d4037", label: "Tables", icon: <MdTableBar className="text-3xl" />, key: "tables" },
  { bg: "#1a237e", label: "Staff Users", icon: <MdPeople className="text-3xl" />, key: "users" },
];

const quickActions = [
  { label: "New Order", path: "/dashboard/menu", color: "bg-primary" },
  { label: "Manage Tables", path: "/dashboard/tables", color: "bg-[#1f1e31]" },
  { label: "View Orders", path: "/dashboard/orders", color: "bg-[#6a1b9a]" },
  { label: "Add Category", path: "/dashboard/items", color: "bg-[#2e7d32]" },
];

export default function AdminDashboard() {
  const navigate = useNavigate();
  const [stats, setStats] = useState({ orders: 0, categories: 0, items: 0, tables: 0, users: 0 });

  const { data: ordersData } = useQuery({
    queryKey: ["admin-orders"],
    queryFn: () => getOrders().then((r) => r.data),
  });

  const { data: tablesData } = useQuery({
    queryKey: ["admin-tables"],
    queryFn: () => getTables().then((r) => r.data),
  });

  const { data: categoriesData } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => axiosWrapper.get("/api/menu/categories").then((r) => r.data),
  });

  const { data: usersData } = useQuery({
    queryKey: ["admin-users-count"],
    queryFn: () => axiosWrapper.get("/api/admin/users?limit=1").then((r) => r.data),
  });

  const { data: itemsData } = useQuery({
    queryKey: ["admin-items-count"],
    queryFn: () => axiosWrapper.get("/api/menu/items?limit=1").then((r) => r.data),
  });

  useEffect(() => {
    if (ordersData?.data) setStats((s) => ({ ...s, orders: Array.isArray(ordersData.data) ? ordersData.data.length : 0 }));
    if (tablesData?.data) setStats((s) => ({ ...s, tables: Array.isArray(tablesData.data) ? tablesData.data.length : 0 }));
    if (categoriesData?.data) setStats((s) => ({ ...s, categories: Array.isArray(categoriesData.data) ? categoriesData.data.length : 0 }));
    if (itemsData?.meta?.total !== undefined) setStats((s) => ({ ...s, items: itemsData.meta.total }));
    if (usersData?.data) setStats((s) => ({ ...s, users: usersData.data?.total || 0 }));
  }, [ordersData, tablesData, categoriesData, usersData, itemsData]);

  return (
    <div>
      {/* Page header */}
      <div className="mb-8">
        <h1 className="text-3xl font-heading font-bold text-secondary">Dashboard</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Overview of your restaurant</p>
      </div>

      {/* Stats cards - sushi brand colors */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-5 mb-10">
        {cardColors.map((card) => (
          <div
            key={card.key}
            className="rounded-2xl overflow-hidden shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 cursor-pointer"
            style={{ backgroundColor: card.bg }}
            onClick={() => {
              const pathMap = { orders: "/dashboard/orders", categories: "/dashboard/items", items: "/dashboard/items/foods", tables: "/dashboard/tables", users: "/dashboard/users" };
              navigate(pathMap[card.key] || "/dashboard");
            }}
          >
            <div className="p-5">
              <div className="flex items-center justify-between mb-4">
                <span className="text-white/70">{card.icon}</span>
                <span className="text-3xl font-heading font-bold text-white">
                  {stats[card.key]}
                </span>
              </div>
              <p className="text-white/80 text-sm font-body font-medium">{card.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Quick Actions */}
      <h2 className="font-heading text-xl font-semibold text-secondary mb-4">Quick Actions</h2>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {quickActions.map((action) => (
          <button
            key={action.path}
            onClick={() => navigate(action.path)}
            className={`${action.color} text-white rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 text-left`}
          >
            <div className="flex items-center justify-between">
              <span className="text-sm font-body font-medium">{action.label}</span>
              <MdArrowForward className="text-white/60" />
            </div>
          </button>
        ))}
      </div>

      {/* Info cards row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-border">
          <h3 className="font-heading font-semibold text-secondary mb-3">Active Orders</h3>
          <p className="text-4xl font-heading font-bold text-primary">{stats.orders}</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Orders in the system</p>
        </div>
        <div className="bg-white rounded-2xl shadow-sm p-6 border border-border">
          <h3 className="font-heading font-semibold text-secondary mb-3">Tables Available</h3>
          <p className="text-4xl font-heading font-bold text-[#2e7d32]">{stats.tables}</p>
          <p className="text-sm text-muted-foreground font-body mt-1">Tables across restaurant</p>
        </div>
      </div>
    </div>
  );
}
