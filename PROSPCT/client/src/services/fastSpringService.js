import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../utils/apiConstant";

const fastSpringService = {
  /**
   * Initialize Fast Spring checkout
   */
  initializeCheckout: async (productData, totalAmount, coupon = null) => {
    try {
      const token = Cookies.get("userAccessToken");
      const headers = { Authorization: `Bearer ${token}` };

      const response = await axios.post(
        `${API_CONFIG.API_ENDPOINT}/api/payment/fastspring/checkout`,
        {
          productData,
          totalAmount,
          coupon,
        },
        { headers }
      );

      return {
        checkoutUrl: response.data.checkoutUrl,
        orderId: response.data.orderId,
        transactionId: response.data.transactionId,
      };
    } catch (error) {
      // console.error("FastSpring checkout error:", error);
      throw new Error(
        error.response?.data?.error || "Failed to initialize FastSpring checkout"
      );
    }
  },

  /**
   * Redirect to Fast Spring checkout
   */
  redirectToCheckout: async (productData, totalAmount, coupon = null) => {
    try {
      const checkoutData = await fastSpringService.initializeCheckout(
        productData,
        totalAmount,
        coupon
      );

      if (checkoutData.checkoutUrl) {
        // Redirect to Fast Spring hosted checkout
        window.location.href = checkoutData.checkoutUrl;
      } else {
        throw new Error("No checkout URL provided");
      }
    } catch (error) {
      // console.error("Redirect to FastSpring checkout failed:", error);
      throw error;
    }
  },

  /**
   * Open Fast Spring checkout in new window
   */
  openCheckoutWindow: async (productData, totalAmount, coupon = null) => {
    try {
      const checkoutData = await fastSpringService.initializeCheckout(
        productData,
        totalAmount,
        coupon
      );

      if (checkoutData.checkoutUrl) {
        const width = 600;
        const height = 800;
        const left = window.screenX + (window.outerWidth - width) / 2;
        const top = window.screenY + (window.outerHeight - height) / 2;

        window.open(
          checkoutData.checkoutUrl,
          "FastSpringCheckout",
          `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes`
        );

        return checkoutData;
      } else {
        throw new Error("No checkout URL provided");
      }
    } catch (error) {
      // console.error("Failed to open FastSpring checkout:", error);
      throw error;
    }
  },
};

export default fastSpringService;
