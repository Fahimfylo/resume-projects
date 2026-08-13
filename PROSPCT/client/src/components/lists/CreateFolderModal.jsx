import { useState } from "react";
import { X } from "lucide-react";

export default function CreateFolderModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState("");
  const [creating, setCreating] = useState(false);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!name.trim()) return;
    setCreating(true);
    try {
      await onCreate?.(name.trim());
      setName("");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-slate-900">Create folder</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-slate-700">Folder name</label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter folder name"
              className="w-full rounded border border-gray-200 px-3 py-2 text-sm focus:border-sky-500 focus:ring-2 focus:ring-sky-200 outline-none"
            />
          </div>

          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-semibold text-slate-700 bg-gray-100 rounded hover:bg-gray-200"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={creating || !name.trim()}
              className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
            >
              {creating ? "Creating…" : "Create"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
