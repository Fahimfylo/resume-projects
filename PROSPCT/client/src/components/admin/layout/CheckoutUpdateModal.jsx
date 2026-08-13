import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  AlertCircle,
} from "lucide-react";

export default function CheckoutUpdateModal({
  isOpen,
  onClose,
  onSave,
  method,
  mode = "edit",
}) {
  const [formData, setFormData] = useState({ title: "", src: "", disabled: false });
  const [imageError, setImageError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    if (isOpen) {
      setFormData({
        title: mode === "edit" ? method?.title || "" : "",
        src: mode === "edit" ? method?.src || "" : "",
        disabled: mode === "edit" ? method?.disabled || false : false,
      });
      setImageError(false);
      setErrors({});
    }
  }, [isOpen, method, mode]);

  const validate = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Method name is required";
    if (!formData.src.trim()) newErrors.src = "Image URL is required";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setIsSaving(true);
    try {
      await onSave(formData, method);
      onClose();
    } catch (err) {
      // console.error("Save failed", err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm"
          />

          {/* Modal Card */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden bg-white shadow-2xl dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800"
          >
            {/* Header */}
            <div className="relative px-6 py-5 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
                    {mode === "edit"
                      ? "Edit Payment Method"
                      : "New Payment Method"}
                  </h2>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
                    Configure how customers see this payment option.
                  </p>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 transition-colors rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-600"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              {/* Title Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium leading-none text-slate-700 dark:text-slate-300">
                  Method Display Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Stripe, PayPal, Wire Transfer"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData({ ...formData, title: e.target.value })
                  }
                  className={`w-full px-4 py-2.5 bg-slate-50 dark:bg-slate-950 border rounded-xl transition-all outline-none focus:ring-2 
                    ${
                      errors.title
                        ? "border-red-500 focus:ring-red-200 dark:focus:ring-red-900/30"
                        : "border-slate-200 dark:border-slate-700 focus:border-blue-500 focus:ring-blue-100 dark:focus:ring-blue-900/20"
                    }`}
                />
                {errors.title && (
                  <p className="flex items-center gap-1 text-xs font-medium text-red-500">
                    <AlertCircle size={12} /> {errors.title}
                  </p>
                )}
              </div>

              {/* Image URL Input */}
              <div className="space-y-2">
                <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                  Logo Asset URL
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none text-slate-400">
                    <ImageIcon size={18} />
                  </div>
                  <input
                    type="text"
                    placeholder="https://cdn.example.com/logo.svg"
                    value={formData.src}
                    onChange={(e) => {
                      setFormData({ ...formData, src: e.target.value });
                      setImageError(false);
                    }}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-700 rounded-xl outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-900/20 focus:border-blue-500 transition-all"
                  />
                </div>
              </div>

              {/* Enable/Disable Toggle */}
              <div className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                <div>
                  <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
                    Payment Method Status
                  </label>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                    {formData.disabled 
                      ? "Disabled methods are blurred for admins and hidden from users"
                      : "Enabled methods are visible to users during checkout"
                    }
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, disabled: !formData.disabled })}
                  className={`relative inline-flex h-7 w-12 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    formData.disabled
                      ? "bg-gray-300 dark:bg-gray-600"
                      : "bg-green-500"
                  }`}
                >
                  <span
                    className={`inline-block h-5 w-5 transform rounded-full bg-white shadow transition-transform ${
                      formData.disabled ? "translate-x-1" : "translate-x-6"
                    }`}
                  />
                </button>
              </div>

              {/* Method Status Badge Preview */}
              {formData.disabled && (
                <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/30">
                  <svg className="w-4 h-4 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <p className="text-xs font-medium text-amber-700 dark:text-amber-400">
                    This payment method will be <strong>hidden from users</strong> and appear blurred in the admin layout.
                  </p>
                </div>
              )}

               {/* Enhanced Image Preview */}
              <div className="relative group overflow-hidden rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 p-8 flex flex-col items-center justify-center min-h-[120px]">
                <span className="absolute top-2 left-3 text-[10px] font-bold uppercase tracking-widest text-slate-400">
                  Preview
                </span>
                {formData.src && !imageError ? (
                  <img
                    src={formData.src}
                    alt="Preview"
                    className="max-h-16 w-auto object-contain transition-transform duration-300 group-hover:scale-110"
                    onError={() => setImageError(true)}
                  />
                ) : (
                  <div className="flex flex-col items-center text-slate-400">
                    <ImageIcon size={32} strokeWidth={1.5} />
                    <p className="mt-2 text-xs">No valid image provided</p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="flex items-center justify-end gap-3 px-6 py-5 bg-slate-50/50 dark:bg-slate-800/30 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={onClose}
                disabled={isSaving}
                className="px-4 py-2 text-sm font-semibold transition-colors rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-200/50 dark:hover:bg-slate-800"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={isSaving}
                className="relative flex items-center justify-center gap-2 px-6 py-2 text-sm font-semibold text-white transition-all bg-blue-600 rounded-xl hover:bg-blue-700 disabled:opacity-70 disabled:cursor-not-allowed shadow-md shadow-blue-500/20 active:scale-[0.98]"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Processing...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    <span>
                      {mode === "edit" ? "Save Changes" : "Create Method"}
                    </span>
                  </>
                )}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
