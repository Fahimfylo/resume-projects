import PropTypes from "prop-types";
import { useEffect, useState } from "react";
import { X } from "lucide-react";

export default function EditListModal({ isOpen, onClose, onSave, initialName = "" }) {
  const [name, setName] = useState(initialName);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setName(initialName || "");
    }
  }, [isOpen, initialName]);

  if (!isOpen) return null;

  const handleSave = async () => {
    if (!name.trim()) return;
    setSaving(true);
    try {
      await onSave?.(name.trim());
      setName("");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h2 className="text-lg font-semibold text-slate-900">Edit list name</h2>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 bg-white rounded-xl">
          <div className="space-y-2.5">
            <label className="block text-sm font-semibold text-slate-700 ml-0.5">
              List name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Q4 Marketing Campaign"
              className="w-full px-4 py-3 text-sm bg-slate-50 border border-slate-200 rounded-xl 
                 placeholder:text-slate-400 outline-none transition-all
                 focus:bg-white focus:border-sky-500 focus:ring-4 focus:ring-sky-500/10 
                 hover:border-slate-300"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 text-sm font-semibold text-slate-600 bg-white border border-slate-200 
                 rounded-lg hover:bg-slate-50 hover:text-slate-900 transition-colors active:scale-95"
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              disabled={saving || !name.trim()}
              className="relative px-6 py-2.5 text-sm font-semibold text-white bg-sky-600 
                 rounded-lg shadow-sm shadow-sky-200 overflow-hidden transition-all
                 hover:bg-sky-700 active:scale-95
                 disabled:opacity-50 disabled:cursor-not-allowed disabled:shadow-none 
                 disabled:active:scale-100"
            >
              <span className={saving ? "opacity-0" : "opacity-100"}>
                {saving ? "Saving..." : "Save"}
              </span>

              {saving && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <svg
                    className="animate-spin h-5 w-5 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                </div>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

EditListModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSave: PropTypes.func.isRequired,
  initialName: PropTypes.string,
};
