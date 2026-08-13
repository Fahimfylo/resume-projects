/* eslint-disable react/prop-types */
import { RiInboxLine, RiAddLine } from "react-icons/ri";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

export default function EmptyState({
  icon: Icon = RiInboxLine,
  title = "Nothing here yet",
  subtitle = "Get started by creating your first item. It only takes a few seconds.",
  actionLabel = null,
  actionPath = null,
  actionCallback = null,
  secondaryActionLabel = null,
  secondaryActionCallback = null,
  size = "md", // sm, md, lg
  iconColor = "text-sky-600",
}) {
  const sizeClasses = {
    sm: "py-16",
    md: "py-24",
    lg: "py-32",
  };

  const iconSizeMap = {
    sm: 36,
    md: 44,
    lg: 52,
  };

  return (
    <motion.div
      className={`w-full flex items-center justify-center ${sizeClasses[size]}`}
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
    >
      <div className="w-full max-w-lg text-center px-6">
        {/* Icon Container */}
        <div className="mx-auto mb-6 flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-sky-100 to-sky-50 dark:from-sky-900/30 dark:to-gray-800/50 shadow-inner">
          <Icon size={iconSizeMap[size]} className={`${iconColor} dark:${iconColor.replace('text-', 'dark:text-')} opacity-90`} />
        </div>

        {/* Title */}
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>

        {/* Subtitle */}
        <p className="text-gray-500 dark:text-gray-400 text-sm leading-relaxed mb-8">{subtitle}</p>

        {/* Actions */}
        {(actionLabel || secondaryActionLabel) && (
          <div className="flex items-center justify-center gap-3 flex-wrap">
            {/* Primary Action */}
            {actionLabel &&
              (actionPath || actionCallback) &&
              (actionPath ? (
                <Link
                  to={actionPath}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 dark:shadow-none hover:shadow-sky-300 dark:hover:shadow-none"
                >
                  <RiAddLine size={18} />
                  {actionLabel}
                </Link>
              ) : (
                <button
                  onClick={actionCallback}
                  className="inline-flex items-center gap-2 px-5 py-2.5 bg-sky-600 text-white text-sm font-medium rounded-xl hover:bg-sky-700 transition-all shadow-lg shadow-sky-200 dark:shadow-none hover:shadow-sky-300 dark:hover:shadow-none"
                >
                  <RiAddLine size={18} />
                  {actionLabel}
                </button>
              ))}

            {/* Secondary Action */}
            {secondaryActionLabel && (
              <button
                onClick={secondaryActionCallback}
                className="px-5 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 transition"
              >
                {secondaryActionLabel}
              </button>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
