import useStore from "../store/store";
import { toast } from "react-toastify";

/**
 * Helper to show toast only if popup notifications are disabled
 * This prevents duplicate notifications when popup is enabled
 */
export const showToastIfPopupDisabled = (message, type = "success") => {
  const { notificationPrefs } = useStore.getState();
  const { popup } = notificationPrefs.inApp;

  // Only show toast if popup is disabled
  if (!popup) {
    const toastType = type === "error" ? toast.error : type === "info" ? toast.info : toast.success;
    toastType(message);
  }
};

/**
 * Notification helper function to add notifications with consistent formatting
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type (success, error, info)
 * @param {string} options.category - Notification category (export, database, search, credit)
 */
export const addNotification = ({ title, message, type = "success", category }) => {
  const { addNotification: storeAddNotification, incrementUnread, notificationPrefs } = useStore.getState();

  // Check user preferences for notification delivery
  const { bell, popup } = notificationPrefs.inApp;

  // Show popup toast if enabled
  if (popup) {
    const toastType = type === "error" ? toast.error : type === "info" ? toast.info : toast.success;
    toastType(`${title}: ${message}`);
  }

  // Add to bell if enabled
  if (bell) {
    storeAddNotification({
      title,
      message,
      type,
      category,
    });

    incrementUnread();
  }
};

/**
 * Notification helper function that only adds to bell (no toast)
 * Use this when you want to handle toast separately with showToastIfPopupDisabled
 * @param {Object} options - Notification options
 * @param {string} options.title - Notification title
 * @param {string} options.message - Notification message
 * @param {string} options.type - Notification type (success, error, info)
 * @param {string} options.category - Notification category (export, database, search, credit)
 */
export const addBellNotification = ({ title, message, type = "success", category }) => {
  const { addNotification: storeAddNotification, incrementUnread, notificationPrefs } = useStore.getState();

  // Check user preferences for notification delivery
  const { bell } = notificationPrefs.inApp;

  // Add to bell if enabled
  if (bell) {
    storeAddNotification({
      title,
      message,
      type,
      category,
    });

    incrementUnread();
  }
};

/**
 * Pre-configured notification helpers for common actions
 */
export const notifyExport = (count, format) => {
  addNotification({
    title: "Export completed",
    message: `${count} item(s) exported to ${format}`,
    type: "success",
    category: "export",
  });
};

export const notifySave = (count, listNames) => {
  addNotification({
    title: "Items saved successfully",
    message: `${count} item(s) saved to ${listNames.length > 0 ? listNames.join(", ") : "your lists"}`,
    type: "success",
    category: "database",
  });
};

export const notifyListCreated = (name) => {
  addBellNotification({
    title: "List created",
    message: `List "${name}" created successfully`,
    type: "success",
    category: "database",
  });
};

export const notifyListDeleted = () => {
  addBellNotification({
    title: "List deleted",
    message: "List has been deleted successfully",
    type: "success",
    category: "database",
  });
};

export const notifyFolderCreated = (name) => {
  addBellNotification({
    title: "Folder created",
    message: `Folder "${name}" created successfully`,
    type: "success",
    category: "database",
  });
};

export const notifyFolderDeleted = () => {
  addBellNotification({
    title: "Folder deleted",
    message: "Folder has been deleted successfully",
    type: "success",
    category: "database",
  });
};

export const notifyContactDeleted = (count) => {
  addNotification({
    title: "Contact deleted",
    message: `${count} contact(s) deleted successfully`,
    type: "success",
    category: "database",
  });
};

export const notifySearchDeleted = (type, count) => {
  addBellNotification({
    title: `${type} search deleted`,
    message: `${count} ${type.toLowerCase()} search(es) deleted successfully`,
    type: "success",
    category: "search",
  });
};

export const notifySearchSaved = (name) => {
  addBellNotification({
    title: "Search saved",
    message: `Search saved as "${name}"`,
    type: "success",
    category: "search",
  });
};

export const notifyRecentToSaved = (name) => {
  addBellNotification({
    title: "Search converted",
    message: `Recent search converted to saved search "${name}"`,
    type: "success",
    category: "search",
  });
};
