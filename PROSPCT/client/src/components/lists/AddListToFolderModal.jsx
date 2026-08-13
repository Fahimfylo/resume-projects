import { useMemo, useState } from "react";
import { X } from "lucide-react";

export default function AddListToFolderModal({
  isOpen,
  onClose,
  folderId,
  allLists = [],
  onAddExistingList,
  onCreateNewList,
}) {
  const [newListName, setNewListName] = useState("");
  const [creating, setCreating] = useState(false);
  const [addingId, setAddingId] = useState(null);

  const availableLists = useMemo(() => {
    if (!folderId) return [];
    return allLists.filter(
      (list) => String(list.folderId || "") !== String(folderId),
    );
  }, [allLists, folderId]);

  if (!isOpen) return null;

  const handleCreate = async () => {
    if (!newListName.trim()) return;

    setCreating(true);
    try {
      await onCreateNewList?.(newListName.trim());
      setNewListName("");
    } finally {
      setCreating(false);
    }
  };

  const handleAdd = async (listId) => {
    setAddingId(listId);
    try {
      await onAddExistingList?.(listId);
    } finally {
      setAddingId(null);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-slate-900">
            Add list to folder
          </h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-5">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <div className="text-sm font-medium text-slate-700">
                Existing lists
              </div>
              <div className="text-xs text-slate-500">
                (select to add to this folder)
              </div>
            </div>
            <div className="max-h-40 overflow-y-auto rounded-lg border border-gray-200 bg-slate-50">
              {availableLists.length === 0 ? (
                <div className="p-4 space-y-3">
                  <div className="text-sm text-slate-500">
                    No available lists to add.
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newListName}
                      onChange={(e) => setNewListName(e.target.value)}
                      placeholder="New list name"
                      className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-sky-500"
                    />
                    <button
                      onClick={handleCreate}
                      disabled={!newListName.trim() || creating}
                      className="px-4 py-2 text-sm font-semibold text-white bg-sky-600 rounded hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {creating ? "Creating…" : "Create"}
                    </button>
                  </div>
                </div>
              ) : (
                availableLists.map((list) => (
                  <div
                    key={list._id}
                    className="flex items-center justify-between px-4 py-2 border-b last:border-b-0"
                  >
                    <span className="text-sm text-slate-800">{list.name}</span>
                    <button
                      onClick={() => handleAdd(list._id)}
                      disabled={addingId === list._id}
                      className="px-3 py-1 text-xs font-semibold text-white bg-sky-600 rounded hover:bg-sky-700 disabled:cursor-not-allowed disabled:bg-slate-300"
                    >
                      {addingId === list._id ? "Adding…" : "Add"}
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="text-xs text-slate-500">
            Tip: You can add a list to this folder, then edit it from the main
            list view.
          </div>
        </div>
      </div>
    </div>
  );
}
