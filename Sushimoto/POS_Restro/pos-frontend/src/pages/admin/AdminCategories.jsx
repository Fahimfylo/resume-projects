import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MdAdd, MdEdit, MdDelete } from "react-icons/md";
import { axiosWrapper } from "../../https/axiosWrapper";

// Theme-aligned Japanese palette inspired by the Sushimoto customer app
const defaultColors = [
  "#a43c3c", // Primary Deep Red (Sushimoto Signature)
  "#d95d39", // Warm Terracotta Orange
  "#e0893c", // Muted Amber / Salmon Accent
  "#c49245", // Golden Umami Yellow
  "#6b7a52", // Matcha Green
  "#4d5b4a", // Deep Moss Green
  "#63524b", // Earthy Charcoal/Roasted Tea
  "#966c5d", // Soft Reddish Brown
];

export default function AdminCategories() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({
    name: "",
    icon: "",
    bgColor: "#a43c3c",
    sortOrder: 0,
  });

  const { data, isLoading } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () =>
      axiosWrapper.get("/api/menu/categories").then((r) => r.data?.data || []),
  });

  const createMutation = useMutation({
    mutationFn: (body) => axiosWrapper.post("/api/menu/categories", body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setShowModal(false);
      resetForm();
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) =>
      axiosWrapper.put(`/api/menu/categories/${id}`, body),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] });
      setShowModal(false);
      resetForm();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosWrapper.delete(`/api/menu/categories/${id}`),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["admin-categories"] }),
  });

  const resetForm = () =>
    setForm({ name: "", icon: "", bgColor: "#a43c3c", sortOrder: 0 });
  const openCreate = () => {
    setEditing(null);
    resetForm();
    setShowModal(true);
  };
  const openEdit = (cat) => {
    setEditing(cat);
    setForm({
      name: cat.name,
      icon: cat.icon || "",
      bgColor: cat.bgColor || "#a43c3c",
      sortOrder: cat.sortOrder || 0,
    });
    setShowModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editing) updateMutation.mutate({ id: editing._id, body: form });
    else createMutation.mutate(form);
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary">
            Categories
          </h1>
          <p className="text-sm text-muted-foreground font-body mt-1">
            Manage your menu categories
          </p>
        </div>
        <button
          onClick={openCreate}
          className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-body flex items-center gap-2 hover:bg-primary-dark transition-all shadow-sm hover:shadow-md"
        >
          <MdAdd className="text-lg" /> Add Category
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground font-body">
          Loading...
        </div>
      ) : !data?.length ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-border shadow-sm">
          <p className="text-muted-foreground font-body">No categories yet</p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {data.map((cat) => (
            <div
              key={cat._id}
              className="bg-white rounded-2xl shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-300 overflow-hidden border border-border"
            >
              <div
                className="h-24 flex items-center justify-center text-5xl"
                style={{ backgroundColor: cat.bgColor || "#a43c3c" }}
              >
                {cat.icon || "\u{1F372}"}
              </div>
              <div className="p-5">
                <h3 className="font-heading font-semibold text-secondary text-lg">
                  {cat.name}
                </h3>
                <p className="text-xs text-muted-foreground font-body mt-1">
                  Sort: {cat.sortOrder || 0}
                </p>
                <div className="flex items-center gap-3 mt-4 pt-3 border-t border-border">
                  <button
                    onClick={() => openEdit(cat)}
                    className="text-muted-foreground hover:text-primary transition-colors text-sm flex items-center gap-1"
                  >
                    <MdEdit /> Edit
                  </button>
                  <button
                    onClick={() => {
                      if (confirm("Delete this category?"))
                        deleteMutation.mutate(cat._id);
                    }}
                    className="text-muted-foreground hover:text-red-500 transition-colors text-sm flex items-center gap-1"
                  >
                    <MdDelete /> Delete
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <div
          className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center"
          onClick={() => setShowModal(false)}
        >
          <div
            className="bg-white rounded-2xl p-6 w-[420px] shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <h2 className="text-xl font-heading font-bold text-secondary mb-4">
              {editing ? "Edit Category" : "New Category"}
            </h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">
                  Name
                </label>
                <input
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  required
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  style={{ backgroundColor: "#f6e5cd" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">
                  Icon (emoji)
                </label>
                <input
                  value={form.icon}
                  onChange={(e) => setForm({ ...form, icon: e.target.value })}
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  style={{ backgroundColor: "#f6e5cd" }}
                />
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">
                  Color
                </label>
                <div className="flex gap-2 flex-wrap">
                  {defaultColors.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setForm({ ...form, bgColor: c })}
                      className={`w-8 h-8 rounded-xl border-2 transition-all ${form.bgColor === c ? "border-primary scale-110 shadow-md" : "border-transparent"}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">
                  Sort Order
                </label>
                <input
                  type="number"
                  value={form.sortOrder}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                  className="w-full border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all"
                  style={{ backgroundColor: "#f6e5cd" }}
                />
              </div>
              <div className="flex items-center gap-3 pt-3">
                <button
                  type="submit"
                  className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-body hover:bg-primary-dark transition-all shadow-sm"
                >
                  {editing ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="text-muted-foreground text-sm font-body hover:text-secondary transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
