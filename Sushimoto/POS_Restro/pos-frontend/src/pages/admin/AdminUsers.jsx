import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MdAdd, MdEdit, MdDelete, MdSearch } from "react-icons/md";
import { useSelector } from "react-redux";
import { axiosWrapper } from "../../https/axiosWrapper";

const roleColors = {
  superadmin: "bg-red-50 text-red-600",
  admin: "bg-purple-50 text-purple-600",
  manager: "bg-blue-50 text-blue-600",
  chef: "bg-orange-50 text-orange-600",
  cashier: "bg-green-50 text-green-600",
  waiter: "bg-yellow-50 text-yellow-600",
  delivery: "bg-teal-50 text-teal-600",
  customer: "bg-gray-50 text-muted-foreground",
};

export default function AdminUsers() {
  const queryClient = useQueryClient();
  const currentUser = useSelector((state) => state.user);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [search, setSearch] = useState("");
  const [form, setForm] = useState({ name: "", email: "", password: "", phone: "", role: "waiter" });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => axiosWrapper.get("/api/admin/users?limit=100").then((r) => r.data?.data || { users: [], total: 0 }),
  });

  const createMutation = useMutation({
    mutationFn: (body) => axiosWrapper.post("/api/admin/users", body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setShowModal(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => axiosWrapper.put(`/api/admin/users/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-users"] }); setShowModal(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosWrapper.delete(`/api/admin/users/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const resetForm = () => setForm({ name: "", email: "", password: "", phone: "", role: "waiter" });
  const openCreate = () => { setEditing(null); resetForm(); setShowModal(true); };
  const openEdit = (user) => { setEditing(user); setForm({ name: user.name, email: user.email, password: "", phone: user.phone || "", role: user.role }); setShowModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = editing ? { name: form.name, phone: form.phone, role: form.role } : form;
    if (editing) updateMutation.mutate({ id: editing._id, body });
    else createMutation.mutate(body);
  };

  const users = data?.users || [];
  const filtered = search ? users.filter((u) => u.name?.toLowerCase().includes(search.toLowerCase()) || u.email?.toLowerCase().includes(search.toLowerCase())) : users;
  const isWaiter = currentUser.role?.toLowerCase() === "waiter";

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary">Users</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Manage system users</p>
        </div>
        {!isWaiter && (
          <button onClick={openCreate} className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-body flex items-center gap-2 hover:bg-primary-dark transition-all shadow-sm hover:shadow-md">
            <MdAdd className="text-lg" /> Add User
          </button>
        )}
      </div>

      <div className="relative max-w-xs mb-5">
        <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search by name or email..." className="w-full border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-creamson" />
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground font-body">Loading...</div>
      ) : (
        <div className="bg-white rounded-2xl border border-border shadow-sm overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-muted text-left">
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Phone</th>
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Role</th>
                <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {!filtered.length ? (
                <tr><td colSpan={5} className="text-center py-16 text-muted-foreground font-body">No users found</td></tr>
              ) : (
                filtered.map((user) => (
                  <tr key={user._id} className="border-t border-border hover:bg-muted/50 transition-colors">
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">{user.name?.[0]?.toUpperCase() || "U"}</div>
                        <span className="font-medium text-secondary">{user.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-muted-foreground">{user.email}</td>
                    <td className="px-5 py-4 text-muted-foreground">{user.phone || "-"}</td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium capitalize ${roleColors[user.role] || "bg-gray-50 text-muted-foreground"}`}>
                        {user.role}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {!isWaiter ? (
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(user)} className="text-muted-foreground hover:text-primary transition-colors"><MdEdit className="text-lg" /></button>
                          <button onClick={() => { if (confirm("Delete this user?")) deleteMutation.mutate(user._id); }} className="text-muted-foreground hover:text-red-500 transition-colors"><MdDelete className="text-lg" /></button>
                        </div>
                      ) : (
                        <span className="text-muted-foreground text-xs">View only</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[420px] shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-heading font-bold text-secondary mb-4">{editing ? "Edit User" : "New User"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Email *</label>
                <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required={!editing} disabled={!!editing} className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary disabled:bg-gray-50 transition-all" />
              </div>
              {!editing && (
                <div>
                  <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Password *</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required={!editing} className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Phone</label>
                <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Role</label>
                <select value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value })} className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary bg-white">
                  {["admin", "manager", "chef", "cashier", "waiter", "delivery"].map((r) => (
                    <option key={r} value={r} disabled={r === "superadmin" && currentUser.role !== "superadmin"}>{r.charAt(0).toUpperCase() + r.slice(1)}</option>
                  ))}
                </select>
              </div>
              <div className="flex items-center gap-3 pt-3">
                <button type="submit" className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-body hover:bg-primary-dark transition-all shadow-sm">
                  {editing ? "Update" : "Create"}
                </button>
                <button type="button" onClick={() => setShowModal(false)} className="text-muted-foreground text-sm font-body hover:text-secondary transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
