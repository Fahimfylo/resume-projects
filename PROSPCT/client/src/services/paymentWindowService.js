/**
 * Utility service for opening payment URLs in different window modes
 * Supports: same-tab, new-tab, and popup modes
 */

export const PAYMENT_REDIRECT_MODES = {
  SAME_TAB: "same-tab",
  NEW_TAB: "new-tab",
  POPUP: "popup",
};

/**
 * Opens a URL based on the specified redirect mode
 * @param {string} url - The URL to open
 * @param {string} mode - The redirect mode: "same-tab", "new-tab", or "popup"
 * @param {Object} options - Additional options
 * @param {string} options.windowName - Name for the popup window (default: "PaymentPopup")
 * @param {number} options.width - Popup width (default: 500)
 * @param {number} options.height - Popup height (default: 700)
 * @returns {Window|null} The window reference for popup/new-tab modes, null for same-tab
 */
export const openPaymentUrl = (url, mode = PAYMENT_REDIRECT_MODES.SAME_TAB, options = {}) => {
  if (!url) {
    // console.error("[paymentWindowService] No URL provided");
    return null;
  }

  const {
    windowName = "PaymentPopup",
    width = 500,
    height = 700,
  } = options;


  switch (mode) {
    case PAYMENT_REDIRECT_MODES.SAME_TAB:
      window.location.href = url;
      return null;

    case PAYMENT_REDIRECT_MODES.NEW_TAB:
      return window.open(url, "_blank", "noopener,noreferrer");

    case PAYMENT_REDIRECT_MODES.POPUP: {
      const left = window.screenX + (window.outerWidth - width) / 2;
      const top = window.screenY + (window.outerHeight - height) / 2;
      const features = [
        `width=${width}`,
        `height=${height}`,
        `left=${Math.max(0, left)}`,
        `top=${Math.max(0, top)}`,
        "resizable=yes",
        "scrollbars=yes",
        "status=yes",
        "toolbar=no",
        "menubar=no",
        "location=yes",
      ].join(",");

      const popup = window.open(url, windowName, features);
      if (popup) {
        popup.focus();
      }
      return popup;
    }

    default:
      // console.warn(`[paymentWindowService] Unknown mode '${mode}', using same-tab`);
      window.location.href = url;
      return null;
  }
};

/**
 * Creates a popup window monitor that checks if the popup was closed
 * @param {Window} popupWindow - The popup window reference
 * @param {Function} onClose - Callback when popup is closed
 * @param {number} checkInterval - How often to check in ms (default: 500)
 * @returns {Function} A function to stop monitoring
 */
export const monitorPopup = (popupWindow, onClose, checkInterval = 500) => {
  if (!popupWindow) {
    // console.warn("[paymentWindowService] No popup window to monitor");
    return () => {};
  }

  const intervalId = setInterval(() => {
    if (popupWindow.closed) {
      clearInterval(intervalId);
      if (typeof onClose === "function") {
        onClose();
      }
    }
  }, checkInterval);

  return () => {
    clearInterval(intervalId);
  };
};

export default {
  PAYMENT_REDIRECT_MODES,
  openPaymentUrl,
  monitorPopup,
};
