import { useState } from "react";
import { useSelector } from "react-redux";
import { useMutation, useQuery } from "@tanstack/react-query";
import { MdEdit, MdHistory, MdPayment, MdShoppingBag, MdEmail, MdPhone, MdPerson, MdLock } from "react-icons/md";
import { axiosWrapper } from "../../https/axiosWrapper";

const tabs = [
  { key: "edit", label: "Edit Profile", icon: <MdEdit className="text-lg" /> },
  { key: "history", label: "Order History", icon: <MdHistory className="text-lg" /> },
  { key: "billing", label: "Billing", icon: <MdPayment className="text-lg" /> },
];

const roleColors = {
  superadmin: "bg-red-50 text-red-600",
  admin: "bg-purple-50 text-purple-600",
  manager: "bg-blue-50 text-blue-600",
  chef: "bg-orange-50 text-orange-600",
  cashier: "bg-green-50 text-green-600",
  waiter: "bg-yellow-50 text-yellow-600",
  delivery: "bg-teal-50 text-teal-600",
  customer: "bg-gray-50 text-gray-500",
};

export default function AdminProfile() {
  const user = useSelector((state) => state.user);
  const [activeTab, setActiveTab] = useState("edit");
  const [name, setName] = useState(user.name || "");
  const [phone, setPhone] = useState(user.phone || "");
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [message, setMessage] = useState({ text: "", type: "" });

  const { data: ordersData } = useQuery({
    queryKey: ["my-orders"],
    queryFn: () => axiosWrapper.get("/api/orders").then((r) => r.data?.data || []),
  });

  const { data: paymentsData } = useQuery({
    queryKey: ["my-payments"],
    queryFn: () => axiosWrapper.get("/api/payment?limit=10").then((r) => r.data?.data?.payments || []),
  });

  const updateMutation = useMutation({
    mutationFn: (body) => axiosWrapper.put(`/api/admin/users/${user._id}`, body),
    onSuccess: () => setMessage({ text: "Profile updated successfully!", type: "success" }),
    onError: () => setMessage({ text: "Failed to update profile", type: "error" }),
  });

  const passwordMutation = useMutation({
    mutationFn: () => axiosWrapper.patch("/api/users/change-password", { currentPassword, newPassword }),
    onSuccess: () => { setMessage({ text: "Password changed successfully!", type: "success" }); setCurrentPassword(""); setNewPassword(""); },
    onError: () => setMessage({ text: "Failed to change password", type: "error" }),
  });

  const handleProfileSubmit = (e) => { e.preventDefault(); updateMutation.mutate({ name, phone }); };
  const handlePasswordSubmit = (e) => { e.preventDefault(); if (newPassword.length < 6) { setMessage({ text: "Password must be at least 6 characters", type: "error" }); return; } passwordMutation.mutate(); };

  const orders = Array.isArray(ordersData) ? ordersData : [];
  const payments = Array.isArray(paymentsData) ? paymentsData : [];
  const totalOrders = orders.length;
  const totalSpent = payments.reduce((sum, p) => sum + (p.amount || 0), 0);

  const renderEditProfile = () => (
    <>
      <div className="bg-white/40 backdrop-blur-[20px] saturate-[180%] border border-black/6 rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-lg">
        <h2 className="text-xl font-heading font-semibold text-secondary mb-6 pb-4 border-b border-border flex items-center gap-2">
          <MdPerson className="text-primary" /> Personal Information
        </h2>
        <form onSubmit={handleProfileSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Full Name</label>
              <div className="relative">
                <MdPerson className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={name} onChange={(e) => setName(e.target.value)}
                  className="w-full bg-creamson border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-secondary" />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Email</label>
              <div className="relative">
                <MdEmail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input value={user.email} disabled
                  className="w-full bg-creamson/50 border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none font-body text-muted-foreground cursor-not-allowed" />
              </div>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Phone Number</label>
            <div className="relative">
              <MdPhone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input value={phone} onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-creamson border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-secondary" />
            </div>
          </div>
          <button type="submit" disabled={updateMutation.isPending}
            className="bg-primary text-white px-7 py-2.5 rounded-full text-sm font-body font-medium hover:bg-primary-dark transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50">
            {updateMutation.isPending ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>

      <div className="bg-white/40 backdrop-blur-[20px] saturate-[180%] border border-black/6 rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-lg">
        <h2 className="text-xl font-heading font-semibold text-secondary mb-6 pb-4 border-b border-border flex items-center gap-2">
          <MdLock className="text-primary" /> Change Password
        </h2>
        <form onSubmit={handlePasswordSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Current Password</label>
            <input type="password" value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)} required
              className="w-full bg-creamson border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-secondary" />
          </div>
          <div>
            <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required
              className="w-full bg-creamson border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all font-body text-secondary" />
          </div>
          <button type="submit" disabled={passwordMutation.isPending}
            className="bg-primary text-white px-7 py-2.5 rounded-full text-sm font-body font-medium hover:bg-primary-dark transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50">
            {passwordMutation.isPending ? "Changing..." : "Change Password"}
          </button>
        </form>
      </div>
    </>
  );

  const renderOrderHistory = () => (
    <div className="bg-white/40 backdrop-blur-[20px] saturate-[180%] border border-black/6 rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-lg">
      <h2 className="text-xl font-heading font-semibold text-secondary mb-6 flex items-center gap-2">
        <MdShoppingBag className="text-primary" /> Order History
      </h2>
      {orders.length === 0 ? (
        <div className="text-center py-16">
          <MdHistory className="text-5xl text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">No orders yet</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.slice(0, 10).map((order) => (
            <div key={order._id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-5 border border-border/50 flex items-center justify-between hover:shadow-md transition-all duration-300">
              <div>
                <p className="font-medium text-secondary font-body">Order #{order._id?.slice(-6) || "N/A"}</p>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  {order.createdAt ? new Date(order.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading font-semibold text-primary">${(order.total || 0).toFixed(2)}</p>
                <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${
                  order.status === "completed" ? "bg-green-50 text-green-600" :
                  order.status === "pending" ? "bg-yellow-50 text-yellow-600" :
                  "bg-gray-50 text-muted-foreground"
                }`}>{order.status || "N/A"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  const renderBilling = () => (
    <div className="bg-white/40 backdrop-blur-[20px] saturate-[180%] border border-black/6 rounded-2xl p-6 lg:p-8 transition-all duration-300 hover:shadow-lg">
      <h2 className="text-xl font-heading font-semibold text-secondary mb-6 flex items-center gap-2">
        <MdPayment className="text-primary" /> Billing & Payments
      </h2>
      {payments.length === 0 ? (
        <div className="text-center py-16">
          <MdPayment className="text-5xl text-muted-foreground/30 mx-auto mb-4" />
          <p className="text-muted-foreground font-body">No payment history</p>
        </div>
      ) : (
        <div className="space-y-3">
          {payments.map((p) => (
            <div key={p._id} className="bg-white/60 backdrop-blur-sm rounded-2xl p-4 border border-border/50 flex items-center justify-between hover:shadow-md transition-all duration-300">
              <div>
                <p className="text-sm font-medium text-secondary font-body">{p.paymentId || "N/A"}</p>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  {p.createdAt ? new Date(p.createdAt).toLocaleDateString() : "N/A"}
                </p>
              </div>
              <div className="text-right">
                <p className="font-heading font-semibold text-secondary">${(p.amount || 0).toFixed(2)}</p>
                <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-medium ${
                  p.status === "captured" ? "bg-green-50 text-green-600" :
                  p.status === "created" ? "bg-yellow-50 text-yellow-600" :
                  p.status === "failed" ? "bg-red-50 text-red-600" : "bg-gray-50 text-muted-foreground"
                }`}>{p.status || "N/A"}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto pb-8">
      <div className="mb-6">
        <h1 className="text-3xl font-heading font-bold text-secondary">My Profile</h1>
        <p className="text-sm text-muted-foreground font-body mt-1">Manage your account settings and view activity</p>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex items-center gap-2 px-6 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 flex-none ${
              activeTab === tab.key
                ? "bg-primary text-white shadow-md"
                : "bg-white/40 backdrop-blur-sm border border-border text-muted-foreground hover:text-secondary hover:bg-white/60"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {message.text && (
        <div className={`mb-6 px-5 py-3 rounded-2xl text-sm font-body border backdrop-blur-sm ${
          message.type === "success"
            ? "bg-green-50/80 text-green-600 border-green-100"
            : "bg-red-50/80 text-red-600 border-red-100"
        }`}>
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-2 space-y-6">
          {activeTab === "edit" && renderEditProfile()}
          {activeTab === "history" && renderOrderHistory()}
          {activeTab === "billing" && renderBilling()}
        </div>

        {/* Right Column - Profile Summary Glass Card */}
        <div className="lg:col-span-1">
          <div className="bg-white/40 backdrop-blur-[20px] saturate-[180%] border border-black/6 rounded-2xl p-6 lg:p-8 sticky top-24 transition-all duration-300 hover:shadow-lg">
            <div className="flex flex-col items-center text-center mb-6 pb-6 border-b border-border">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center text-primary text-4xl font-bold mb-4 ring-2 ring-primary/20">
                {user.name?.[0]?.toUpperCase() || "U"}
              </div>
              <h3 className="text-xl font-heading font-semibold text-secondary">{user.name || "User"}</h3>
              <p className="text-sm text-muted-foreground font-body mt-1">{user.email}</p>
              <span className={`mt-3 px-4 py-1.5 rounded-full text-xs font-medium capitalize ${roleColors[user.role] || "bg-gray-50 text-muted-foreground"}`}>
                {user.role || "N/A"}
              </span>
            </div>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/30">
                <span className="text-sm text-muted-foreground font-body">Total Orders</span>
                <span className="text-lg font-heading font-semibold text-secondary">{totalOrders}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/30">
                <span className="text-sm text-muted-foreground font-body">Total Spent</span>
                <span className="text-lg font-heading font-semibold text-primary">${totalSpent.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between py-2 px-3 rounded-xl bg-white/30">
                <span className="text-sm text-muted-foreground font-body">Member Since</span>
                <span className="text-sm font-medium text-secondary font-body">
                  {user.createdAt ? new Date(user.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" }) : "N/A"}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
