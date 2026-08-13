"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  User, Mail, Phone, Camera, Package, Save, LogOut,
  History, FileText, ShoppingBag,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";

interface Order {
  _id: string;
  orderStatus: string;
  orderDate: string;
  bills: { total: number; tax: number; totalWithTax: number };
  paymentMethod?: string;
}

const statusColor: Record<string, string> = {
  Pending: "bg-yellow-100 text-yellow-800",
  Confirmed: "bg-blue-100 text-blue-800",
  Preparing: "bg-orange-100 text-orange-800",
  Ready: "bg-green-100 text-green-800",
  Delivered: "bg-green-100 text-green-800",
  Completed: "bg-green-100 text-green-800",
  Cancelled: "bg-red-100 text-red-800",
};

const tabs = [
  { key: "profile", label: "Edit Profile", icon: <User className="w-4 h-4" /> },
  { key: "orders", label: "Order History", icon: <History className="w-4 h-4" /> },
  { key: "billing", label: "Billing", icon: <FileText className="w-4 h-4" /> },
];

export default function ProfilePage() {
  const { user, isAuthenticated, logout } = useAuth();
  const [activeTab, setActiveTab] = useState("profile");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(true);

  useEffect(() => {
    if (user) setName(user.name || "");
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) { setOrdersLoading(false); return; }
    api.get<Order[]>("/order/mine").then((res) => {
      if (res.success && res.data) setOrders(res.data);
    }).catch(() => {}).finally(() => setOrdersLoading(false));
  }, [isAuthenticated]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setSuccess("");
    setError("");
    try {
      const res = await api.patch("/users/profile", {
        name: name || undefined,
        phone: phone || undefined,
        avatar: avatar || undefined,
      });
      if (res.success) {
        setSuccess("Profile updated");
        if (user) user.name = name;
      } else {
        setError(res.message || "Failed to update");
      }
    } catch {
      setError("Something went wrong");
    } finally {
      setSaving(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center gap-4 px-4 pt-24">
        <User className="w-16 h-16 text-muted-foreground" />
        <h2 className="font-heading text-2xl">Sign in to view your profile</h2>
        <Link href="/sign-in" className="bg-primary text-white px-6 py-2 rounded-full hover:bg-primary-dark transition-colors">
          Sign In
        </Link>
      </div>
    );
  }

  const totalSpent = orders.reduce((sum, o) => sum + (o.bills?.totalWithTax || 0), 0);

  return (
    <div className="max-w-5xl mx-auto px-4 pt-28 pb-16">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <div className="flex items-center gap-3 mb-8">
          <User className="w-6 h-6 text-primary" />
          <h1 className="font-heading text-3xl font-semibold">My Profile</h1>
        </div>

        {/* Glass tabs — matching Popular Food filter button style */}
        <div className="flex items-center gap-3 mb-8 overflow-x-auto pb-2">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`flex items-center gap-2 px-7 py-2.5 rounded-full text-sm font-body font-medium transition-all duration-300 flex-none ${
                activeTab === tab.key
                  ? "bg-white text-primary shadow-md"
                  : "bg-white/60 backdrop-blur-sm border border-white/40 text-muted-foreground hover:text-secondary hover:bg-white/80"
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Sidebar — glass card matching food card design */}
          <div className="md:col-span-1">
            <div className="bg-white/60 border border-white/30 rounded-[36px] p-[38px] transition-all duration-300 hover:shadow-lg">
              <div className="flex flex-col items-center text-center">
                <div className="relative mb-4">
                  <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden ring-2 ring-white/50">
                    {avatar ? (
                      <img src={avatar} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <User className="w-10 h-10 text-primary" />
                    )}
                  </div>
                  <label className="absolute bottom-0 right-0 w-7 h-7 rounded-full bg-primary text-white flex items-center justify-center cursor-pointer hover:bg-primary-dark transition-colors shadow-md">
                    <Camera className="w-3.5 h-3.5" />
                    <input type="text" className="hidden" value={avatar} onChange={() => {}} />
                  </label>
                </div>
                <h3 className="font-heading text-lg font-semibold">{user?.name}</h3>
                <p className="text-sm text-muted-foreground font-body mt-1">{user?.email}</p>
                <Badge variant="outline" className="mt-3 capitalize bg-white/50">{user?.role}</Badge>

                <div className="w-full border-t border-white/40 my-6" />

                <div className="w-full space-y-3">
                  <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-white/40">
                    <span className="text-sm text-muted-foreground font-body">Total Orders</span>
                    <span className="text-lg font-heading font-semibold">{orders.length}</span>
                  </div>
                  <div className="flex items-center justify-between py-2 px-4 rounded-xl bg-white/40">
                    <span className="text-sm text-muted-foreground font-body">Total Spent</span>
                    <span className="text-lg font-heading font-semibold text-primary">₹{totalSpent.toFixed(2)}</span>
                  </div>
                </div>

                <button
                  onClick={logout}
                  className="mt-6 w-full flex items-center justify-center gap-2 py-2.5 rounded-full bg-white/40 border border-white/30 text-sm text-muted-foreground hover:text-destructive hover:bg-white/60 transition-all duration-300 font-body"
                >
                  <LogOut className="w-4 h-4" /> Sign Out
                </button>
              </div>
            </div>
          </div>

          {/* Main content area */}
          <div className="md:col-span-2">
            {activeTab === "profile" && (
              <div className="bg-white/60 border border-white/30 rounded-[36px] p-[38px] transition-all duration-300 hover:shadow-lg">
                <h2 className="font-heading text-xl font-semibold mb-6 pb-4 border-b border-white/40 flex items-center gap-2">
                  <User className="w-5 h-5 text-primary" /> Personal Information
                </h2>
                <form onSubmit={handleSave} className="space-y-5">
                  {success && <div className="bg-green-100/80 text-green-800 text-sm rounded-2xl px-5 py-3 border border-green-200">{success}</div>}
                  {error && <div className="bg-red-100/80 text-red-600 text-sm rounded-2xl px-5 py-3 border border-red-200">{error}</div>}

                  <div className="space-y-2">
                    <Label htmlFor="pname" className="font-body text-muted-foreground">Full Name</Label>
                    <div className="relative">
                      <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="pname" className="pl-10 bg-white/50 border-white/40 rounded-2xl font-body" value={name} onChange={(e) => setName(e.target.value)} />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pemail" className="font-body text-muted-foreground">Email</Label>
                    <div className="relative">
                      <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="pemail" className="pl-10 bg-white/30 border-white/40 rounded-2xl font-body text-muted-foreground" value={user?.email || ""} disabled />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pphone" className="font-body text-muted-foreground">Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="pphone" className="pl-10 bg-white/50 border-white/40 rounded-2xl font-body" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Add phone number" />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="pavatar" className="font-body text-muted-foreground">Avatar URL</Label>
                    <div className="relative">
                      <Camera className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input id="pavatar" className="pl-10 bg-white/50 border-white/40 rounded-2xl font-body" value={avatar} onChange={(e) => setAvatar(e.target.value)} placeholder="https://example.com/avatar.jpg" />
                    </div>
                  </div>

                  <button type="submit" disabled={saving}
                    className="inline-flex items-center gap-2 bg-primary text-white px-7 py-2.5 rounded-full text-sm font-body font-medium hover:bg-primary-dark transition-all duration-300 shadow-sm hover:shadow-md disabled:opacity-50"
                  >
                    {saving ? <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
                    Save Changes
                  </button>
                </form>
              </div>
            )}

            {activeTab === "orders" && (
              <div className="bg-white/60 border border-white/30 rounded-[36px] p-[38px] transition-all duration-300 hover:shadow-lg">
                <h2 className="font-heading text-xl font-semibold mb-6 pb-4 border-b border-white/40 flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-primary" /> Order History
                </h2>
                {ordersLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/40" />)}</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <Package className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-body">No orders yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/30 hover:bg-white/60 transition-all duration-300">
                        <div>
                          <p className="text-sm font-medium font-body">#{order._id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground font-body mt-1">{new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-heading font-semibold">₹{order.bills?.totalWithTax?.toFixed(2) || "0.00"}</p>
                          <Badge className={`${statusColor[order.orderStatus] || ""} border-0 text-[10px] mt-1`}>{order.orderStatus}</Badge>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === "billing" && (
              <div className="bg-white/60 border border-white/30 rounded-[36px] p-[38px] transition-all duration-300 hover:shadow-lg">
                <h2 className="font-heading text-xl font-semibold mb-6 pb-4 border-b border-white/40 flex items-center gap-2">
                  <FileText className="w-5 h-5 text-primary" /> Billing History
                </h2>
                {ordersLoading ? (
                  <div className="space-y-3">{[1, 2, 3].map((i) => <Skeleton key={i} className="h-16 w-full rounded-2xl bg-white/40" />)}</div>
                ) : orders.length === 0 ? (
                  <div className="text-center py-12">
                    <FileText className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-body">No billing history</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders.map((order) => (
                      <div key={order._id} className="flex items-center justify-between p-4 rounded-2xl bg-white/40 border border-white/30 hover:bg-white/60 transition-all duration-300">
                        <div>
                          <p className="text-sm font-medium font-body">#{order._id.slice(-6).toUpperCase()}</p>
                          <p className="text-xs text-muted-foreground font-body mt-1">{new Date(order.orderDate).toLocaleDateString()}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-heading font-semibold">₹{order.bills?.totalWithTax?.toFixed(2) || "0.00"}</p>
                          <p className="text-xs text-muted-foreground font-body mt-1">{order.paymentMethod || "N/A"}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </div>
  );
}
