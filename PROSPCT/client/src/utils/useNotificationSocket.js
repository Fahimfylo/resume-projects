import { useEffect, useRef } from "react";
import { io } from "socket.io-client";
import { toast } from "react-toastify";
import useStore from "../store/store";
import API_CONFIG from "../utils/apiConstant";

/**
 * Global socket listener for server-pushed notifications.
 * Mount once in App.jsx — all components benefit.
 */
const useNotificationSocket = () => {
  const socketRef = useRef(null);
  const { addNotification, notificationPrefs, incrementUnread, setNotificationPrefs, isLoggedIn, user } = useStore();

  // Fetch prefs on mount
  useEffect(() => {
    if (!isLoggedIn || !user?._id) return;

    const fetchPrefs = async () => {
      try {
        const token = localStorage.getItem("userAccessToken");
        const res = await fetch(`${API_CONFIG.API_ENDPOINT}/settings/notifications/preferences`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const json = await res.json();
        if (json.success && json.data) {
          setNotificationPrefs({ inApp: json.data.inApp, email: json.data.email });
        }
      } catch {
        // Silently fail — defaults are already set
      }
    };
    fetchPrefs();
  }, [isLoggedIn, user?._id, setNotificationPrefs]);

  // Connect socket
  useEffect(() => {
    if (!isLoggedIn || !user?._id) return;

    const socket = io(API_CONFIG.API_ENDPOINT, {
      transports: ["websocket", "polling"],
      query: { userId: user._id },
    });

    socketRef.current = socket;

    socket.on("notification", (data) => {
      const { inApp, email } = notificationPrefs;

      // If notification has a category, check if user has it enabled
      if (data.category && !email[data.category]) {
        return; // User disabled this notification category
      }

      // Add to notification list (if bell is enabled)
      if (inApp.bell) {
        addNotification({
          id: data.id || Date.now().toString(),
          title: data.title,
          message: data.message,
          type: data.type || "info",
          category: data.category || null,
          timestamp: data.timestamp || new Date().toISOString(),
        });
        incrementUnread();
      }

      // Show popup toast notification
      if (inApp.popup) {
        const toastType = data.type === "error" ? "error" : data.type === "success" ? "success" : "info";
        toast[toastType](data.message || data.title, {
          position: "top-right",
          autoClose: 4000,
        });
      }

      // Play sound
      if (inApp.sound) {
        try {
          const audio = new Audio("/notification-sound.mp3");
          audio.play().catch(() => {});
        } catch {
          // Sound not available
        }
      }
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
    };
  }, [isLoggedIn, user?._id, notificationPrefs, addNotification, incrementUnread]);
};

export default useNotificationSocket;
