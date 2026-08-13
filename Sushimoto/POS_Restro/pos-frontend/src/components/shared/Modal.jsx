import { motion } from "framer-motion";

const Modal = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.3, ease: "easeInOut" }}
        className="bg-white rounded-xl shadow-lg w-full max-w-lg mx-4 border border-border"
      >
        <div className="flex justify-between items-center px-6 py-4 border-b border-border">
          <h2 className="text-xl font-heading font-semibold text-secondary">
            {title}
          </h2>
          <button
            className="text-muted-foreground text-2xl hover:text-secondary transition-colors"
            onClick={onClose}
          >
            &times;
          </button>
        </div>
        <div className="p-6">{children}</div>
      </motion.div>
    </div>
  );
};

export default Modal;
