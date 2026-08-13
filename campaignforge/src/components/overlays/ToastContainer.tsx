import React from 'react';
import { useApp } from '../../context/useApp';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, AlertCircle, Clock, XCircle, X } from 'lucide-react';

const toastConfig: Record<string, { Icon: React.ElementType; borderColor: string; iconColor: string }> = {
  success: { Icon: CheckCircle2, borderColor: 'border-l-[#2D6A4F]', iconColor: 'text-[#2D6A4F]' },
  warning: { Icon: AlertCircle, borderColor: 'border-l-[#B45309]', iconColor: 'text-[#B45309]' },
  error: { Icon: XCircle, borderColor: 'border-l-[#B91C1C]', iconColor: 'text-[#B91C1C]' },
  info: { Icon: Clock, borderColor: 'border-l-[#1A1A1A]', iconColor: 'text-[#1A1A1A]' },
};

export function ToastContainer() {
  const { toasts, removeToast } = useApp();

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => {
          const config = toastConfig[toast.type] || toastConfig.info;
          const Icon = config.Icon;
          return (
            <motion.div
              key={toast.id}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.15 } }}
              className={`pointer-events-auto flex items-start gap-3 p-4 bg-neutral-900/90 text-neutral-100 border-l-4 ${config.borderColor} rounded-lg shadow-xl backdrop-blur-md`}
            >
              <div className={`mt-0.5 ${config.iconColor}`}>
                <Icon size={18} />
              </div>
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold tracking-tight text-neutral-100">{toast.title}</h4>
                <p className="mt-1 text-xs text-neutral-400 line-clamp-2 leading-relaxed">{toast.body}</p>
              </div>
              <button onClick={() => removeToast(toast.id)} className="text-neutral-500 hover:text-neutral-300 transition-colors p-0.5">
                <X size={14} />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
