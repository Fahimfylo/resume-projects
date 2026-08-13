import { useEffect, useRef } from "react";
import {
  Bell,
  X,
  CheckCircle,
  AlertTriangle,
  Download,
  Search,
  Rocket,
  Database,
  RefreshCw,
  BellOff,
} from "lucide-react";
import useStore from "../../../store/store";

function NotificationBar({
  toggleNotificationBar,
  isNotificationVisible,
  inline = false,
}) {
  const barRef = useRef(null);

  const {
    notifications,
    removeNotification,
    clearNotifications,
    resetUnread,
    notificationPrefs,
  } = useStore();

  // 🔥 Format time (real-world UX)
  const formatTime = (timestamp) => {
    const diff = Date.now() - new Date(timestamp).getTime();

    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  };

  // Filter notifications based on user preferences
  const filteredNotifications = notifications.filter((note) => {
    if (!note.category) return true;
    return notificationPrefs.inApp.bell !== false;
  });

  // Clear unread count when opened
  useEffect(() => {
    if (isNotificationVisible) {
      resetUnread();
    }
  }, [isNotificationVisible, resetUnread]);

  // Close on outside click
  useEffect(() => {
    if (inline) return;

    function handleClickOutside(event) {
      if (barRef.current && !barRef.current.contains(event.target)) {
        toggleNotificationBar(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [toggleNotificationBar, inline]);

  // Category icon
  const getCategoryIcon = (category) => {
    switch (category) {
      case "export":
        return <Download className="w-5 h-5 text-indigo-600" />;
      case "search":
        return <Search className="w-5 h-5 text-blue-600" />;
      case "onboarding":
        return <Rocket className="w-5 h-5 text-purple-600" />;
      case "database":
        return <Database className="w-5 h-5 text-teal-600" />;
      case "credit":
        return <RefreshCw className="w-5 h-5 text-amber-600" />;
      default:
        return null;
    }
  };

  // Final icon resolver
  const getIcon = (type, category) => {
    const catIcon = getCategoryIcon(category);
    if (catIcon) return catIcon;

    if (type === "success")
      return <CheckCircle className="w-5 h-5 text-green-600" />;
    if (type === "error")
      return <AlertTriangle className="w-5 h-5 text-red-600" />;

    return <Bell className="w-5 h-5 text-sky-600" />;
  };

  const baseContainerClass = inline
    ? "relative w-full max-w-3xl mx-auto mt-6"
    : "fixed top-0 right-0 z-50 h-screen w-[360px] transition transform duration-300 ease-in-out";

  return (
    <section
      ref={barRef}
      className={`${baseContainerClass} ${inline
          ? ""
          : isNotificationVisible
            ? "translate-x-0"
            : "translate-x-full"
        }`}
    >
      <div className="flex flex-col h-full bg-white/90 backdrop-blur-xl border-l border-gray-200 shadow-2xl">

        {/* 🔹 Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between py-1 px-4 bg-sky-800 backdrop-blur-md border-b border-gray-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-white/20 rounded-full">
              <Bell className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-white">
                Notifications
              </h2>
              <p className="text-xs text-sky-100">
                Stay updated with activity
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={clearNotifications}
              className="text-xs font-medium text-white/80 hover:text-white transition"
            >
              Clear all
            </button>

            <X
              className="w-5 h-5 cursor-pointer text-white/80 hover:text-white transition"
              onClick={() => toggleNotificationBar(false)}
            />
          </div>
        </div>

        {/* 🔹 List */}
        <ul className="flex-1 overflow-y-auto px-3 py-2 space-y-3">
          {filteredNotifications.length === 0 ? (
            <li className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                <BellOff className="w-8 h-8 text-gray-400" />
              </div>
              <p className="text-sm text-gray-600 font-medium">
                No notifications
              </p>
              <p className="text-xs text-gray-400">
                You're all caught up 🎉
              </p>
            </li>
          ) : (
            filteredNotifications.map((note) => (
              <li
                key={note.id}
                className="group relative flex gap-4 p-4 bg-white border border-gray-200 rounded-lg shadow-sm hover:shadow-md transition-all duration-200"
              >
                {/* 🔴 Unread dot */}
                {!note.read && (
                  <span className="absolute top-4 left-2 w-2 h-2 bg-sky-500 rounded-full"></span>
                )}

                {/* Icon */}
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-100">
                  {getIcon(note.type, note.category)}
                </div>

                {/* Content */}
                <div className="flex-1">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-gray-800 leading-tight">
                      {note.title || "Notification"}
                    </h4>

                    <span className="text-[11px] text-gray-400 whitespace-nowrap">
                      {formatTime(note.timestamp)}
                    </span>
                  </div>

                  {note.message && (
                    <p className="mt-1 text-xs text-gray-600 leading-relaxed">
                      {note.message}
                    </p>
                  )}
                </div>

                {/* ❌ Dismiss (hover only) */}
                <button
                  onClick={() => removeNotification(note.id)}
                  className="absolute top-1 right-2 opacity-0 group-hover:opacity-100 transition text-gray-400 hover:text-red-500"
                >
                  <X className="w-4 h-4" />
                </button>
              </li>
            ))
          )}
        </ul>
      </div>
    </section>
  );
}

export default NotificationBar;