import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { MdAdd, MdEdit, MdDelete, MdSearch, MdChevronLeft, MdChevronRight } from "react-icons/md";
import { axiosWrapper } from "../../https/axiosWrapper";

const PAGE_SIZE = 13;

export default function AdminFoodItems() {
  const queryClient = useQueryClient();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [filterCat, setFilterCat] = useState("");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [form, setForm] = useState({
    name: "", price: "", menuCategory: "", category: "", image: "",
    description: "", cookingTime: "", spiceLevel: 1, isAvailable: true,
  });

  const { data: categories } = useQuery({
    queryKey: ["admin-categories"],
    queryFn: () => axiosWrapper.get("/api/menu/categories").then((r) => r.data?.data || []),
  });

  const { data: pageData, isLoading } = useQuery({
    queryKey: ["admin-fooditems", filterCat, page],
    queryFn: () => {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(PAGE_SIZE));
      if (filterCat) params.set("categoryId", filterCat);
      return axiosWrapper.get(`/api/menu/items?${params}`).then((r) => r.data);
    },
  });

  const items = pageData?.data || [];
  const total = pageData?.meta?.total || 0;
  const totalPages = pageData?.meta?.totalPages || 0;

  const createMutation = useMutation({
    mutationFn: (body) => axiosWrapper.post("/api/menu/items", body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-fooditems"] }); setShowModal(false); resetForm(); },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }) => axiosWrapper.put(`/api/menu/items/${id}`, body),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["admin-fooditems"] }); setShowModal(false); resetForm(); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id) => axiosWrapper.delete(`/api/menu/items/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["admin-fooditems"] }),
  });

  const resetForm = () => setForm({ name: "", price: "", menuCategory: categories?.[0]?._id || "", category: "", image: "", description: "", cookingTime: "", spiceLevel: 1, isAvailable: true });

  const openCreate = () => { setEditing(null); resetForm(); setShowModal(true); };
  const openEdit = (item) => { setEditing(item); setForm({ name: item.name, price: item.price, menuCategory: item.menuCategory?._id || item.menuCategory || "", category: item.category || "", image: item.image || "", description: item.description || "", cookingTime: item.cookingTime || "", spiceLevel: item.spiceLevel || 1, isAvailable: item.isAvailable !== false }); setShowModal(true); };

  const handleSubmit = (e) => {
    e.preventDefault();
    const body = { ...form, price: parseFloat(form.price) };
    if (editing) updateMutation.mutate({ id: editing._id, body });
    else createMutation.mutate(body);
  };

  const handleCatChange = (value) => {
    setFilterCat(value);
    setPage(1);
  };

  const filtered = search ? items.filter((i) => i.name?.toLowerCase().includes(search.toLowerCase())) : items;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-heading font-bold text-secondary">Food Items</h1>
          <p className="text-sm text-muted-foreground font-body mt-1">Manage your menu items</p>
        </div>
        <button onClick={openCreate} className="bg-primary text-white px-6 py-2.5 rounded-full text-sm font-body flex items-center gap-2 hover:bg-primary-dark transition-all shadow-sm hover:shadow-md">
          <MdAdd className="text-lg" /> Add Food
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-3 mb-5">
        <div className="relative flex-1 max-w-xs">
          <MdSearch className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search items..." className="w-full border border-border rounded-lg pl-10 pr-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-creamson" />
        </div>
        <select value={filterCat} onChange={(e) => handleCatChange(e.target.value)} className="border border-border rounded-lg px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all bg-creamson">
          <option value="">All Categories</option>
          {categories?.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="text-center py-20 text-muted-foreground font-body">Loading...</div>
      ) : (
        <>
          <div className="bg-white rounded-2xl border border-border shadow-sm overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-muted text-left">
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Name</th>
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Category</th>
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Price</th>
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Sub-Category</th>
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Available</th>
                  <th className="px-5 py-3.5 font-body font-medium text-muted-foreground text-xs uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody>
                {!filtered?.length ? (
                  <tr><td colSpan={6} className="text-center py-16 text-muted-foreground font-body">No items found</td></tr>
                ) : (
                  filtered.map((item) => (
                    <tr key={item._id} className="border-t border-border hover:bg-muted/50 transition-colors">
                      <td className="px-5 py-4 font-medium text-secondary">{item.name}</td>
                      <td className="px-5 py-4 text-muted-foreground">{item.menuCategory?.name || "-"}</td>
                      <td className="px-5 py-4 font-medium">${item.price?.toFixed(2)}</td>
                      <td className="px-5 py-4 text-muted-foreground">{item.category || "-"}</td>
                      <td className="px-5 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.isAvailable ? "bg-green-50 text-green-600" : "bg-red-50 text-red-600"}`}>
                          {item.isAvailable ? "Available" : "Unavailable"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <button onClick={() => openEdit(item)} className="text-muted-foreground hover:text-primary transition-colors"><MdEdit className="text-lg" /></button>
                          <button onClick={() => { if (confirm("Delete this item?")) deleteMutation.mutate(item._id); }} className="text-muted-foreground hover:text-red-500 transition-colors"><MdDelete className="text-lg" /></button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-5">
              <span className="text-sm text-muted-foreground font-body">
                Showing {Math.min((page - 1) * PAGE_SIZE + 1, total)}–{Math.min(page * PAGE_SIZE, total)} of {total}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  disabled={page <= 1}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MdChevronLeft className="text-lg" />
                </button>
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPage(p)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-body transition-colors ${
                      p === page
                        ? "bg-primary text-white"
                        : "border border-border hover:bg-muted"
                    }`}
                  >
                    {p}
                  </button>
                ))}
                <button
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  disabled={page >= totalPages}
                  className="p-2 rounded-lg border border-border hover:bg-muted transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <MdChevronRight className="text-lg" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/30 backdrop-blur-sm z-50 flex items-center justify-center" onClick={() => setShowModal(false)}>
          <div className="bg-white rounded-2xl p-6 w-[520px] max-h-[90vh] overflow-y-auto shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-xl font-heading font-bold text-secondary mb-4">{editing ? "Edit Food Item" : "New Food Item"}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Price *</label>
                  <input type="number" step="0.01" value={form.price} onChange={(e) => setForm({ ...form, price: e.target.value })} required className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary focus:ring-1 focus:ring-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Menu Category *</label>
                <select value={form.menuCategory} onChange={(e) => setForm({ ...form, menuCategory: e.target.value })} required className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary">
                  <option value="">Select...</option>
                  {categories?.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Sub-Category</label>
                  <input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Veg / Non-Veg" className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Cooking Time</label>
                  <input value={form.cookingTime} onChange={(e) => setForm({ ...form, cookingTime: e.target.value })} placeholder="15-20 min" className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Image URL</label>
                <input value={form.image} onChange={(e) => setForm({ ...form, image: e.target.value })} className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-sm font-medium font-body text-muted-foreground mb-1.5">Description</label>
                <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="w-full border border-border rounded-lg bg-creamson px-4 py-2.5 text-sm outline-none focus:border-primary resize-none" />
              </div>
              <div className="flex items-center gap-6">
                <label className="flex items-center gap-2.5 text-sm text-muted-foreground">
                  <input type="checkbox" checked={form.isAvailable} onChange={(e) => setForm({ ...form, isAvailable: e.target.checked })} className="accent-primary w-4 h-4" />
                  Available
                </label>
                <div>
                  <label className="text-sm font-body text-muted-foreground mr-2">Spice</label>
                  <select value={form.spiceLevel} onChange={(e) => setForm({ ...form, spiceLevel: parseInt(e.target.value) })} className="border border-border rounded-lg bg-creamson px-3 py-2 text-sm">
                    {[0, 1, 2, 3, 4, 5].map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
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
