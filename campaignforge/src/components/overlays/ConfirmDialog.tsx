import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertTriangle, X } from 'lucide-react';

export interface ConfirmState {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel?: () => void;
}

interface Props {
  state: ConfirmState;
  setState: (s: ConfirmState) => void;
}

export function ConfirmDialog({ state, setState }: Props) {
  const handleCancel = () => {
    state.onCancel?.();
    setState({ ...state, open: false });
  };

  const handleConfirm = () => {
    state.onConfirm();
    setState({ ...state, open: false });
  };

  return (
    <AnimatePresence>
      {state.open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center p-4"
        >
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={handleCancel} />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            className="relative w-full max-w-[400px] bg-[rgba(255,255,255,0.75)] backdrop-blur-[24px] saturate-[160%] border border-[rgba(255,255,255,0.70)] rounded-[16px] shadow-[0_8px_32px_rgba(17,17,17,0.12)] p-6"
          >
            <button onClick={handleCancel} className="absolute top-4 right-4 text-neutral-400 hover:text-neutral-700 transition-colors cursor-pointer">
              <X size={16} />
            </button>
            <div className="flex items-start gap-4">
              <div className={`mt-0.5 p-2 rounded-full ${state.destructive ? 'bg-red-50 text-red-500' : 'bg-neutral-100 text-neutral-500'}`}>
                <AlertTriangle size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold text-neutral-900">{state.title}</h3>
                <p className="mt-1.5 text-sm text-neutral-500 leading-relaxed">{state.message}</p>
              </div>
            </div>
            <div className="flex items-center justify-end gap-2.5 mt-6">
              <button onClick={handleCancel}
                className="px-4 py-2 rounded-[9999px] text-xs font-semibold text-neutral-600 bg-black/5 hover:bg-black/10 transition-all cursor-pointer">
                {state.cancelLabel || 'Cancel'}
              </button>
              <button onClick={handleConfirm}
                className={`px-4 py-2 rounded-[9999px] text-xs font-semibold text-white transition-all cursor-pointer ${
                  state.destructive
                    ? 'bg-red-500 hover:bg-red-600'
                    : 'bg-[#1A1A1A] hover:bg-[#333]'
                }`}>
                {state.confirmLabel || 'Confirm'}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
