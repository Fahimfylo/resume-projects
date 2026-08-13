import axios from "axios";
import API_CONFIG from "../../utils/apiConstant";
import Cookies from "js-cookie";

const BASE_URL = API_CONFIG.API_ENDPOINT;

/**
 * FastSpring SBL (Storefront Builder Library) Gateway
 * 
 * REQUIREMENTS:
 * 1. Add this script tag to your index.html <head>:
 *    <script 
 *      id="fsc-api"
 *      src="https://sbl.onfastspring.com/sbl/1.0.6/fastspring-builder.min.js"
 *      type="text/javascript"
 *      data-storefront="prospct.test.onfastspring.com"
 *      data-access-key="U46CRMFZROOYBDPE-XUBUW"
 *      data-data-callback="dataCallback"
 *      data-error-callback="fsErrorCallback"
 *      data-popup-closed="onFSPopupClosed"
 *      data-continuous="true">
 *    </script>
 * 
 * 2. Global callbacks must be defined BEFORE React mounts (add to index.html <script>):
 *    <script>
 *      window.dataCallback = function(data) {
 *        if (data.totalValue > 0) {
 *        } else {
 *          // console.warn("[FastSpring] ✗ Session empty - check product paths");
 *        }
 *      };
 *      window.fsErrorCallback = function(code, url) {
 *        // console.error("[FastSpring] SBL error:", code, url);
 *      };
 *      window.onFSPopupClosed = function(orderRef) {
 *        if (orderRef?.id) window.location.replace("/dashboard");
 *      };
 *    </script>
 */

const useFastSpringGateway = () => {

  /**
   * Atomic push to FastSpring - Single call with reset + secure + checkout
   * This ensures the session is valid before the popup opens.
   */
  const pushToFastSpring = async (email, firstName, lastName, items, productData = []) => {
    if (!items?.length) {
      throw new Error("No items provided for FastSpring checkout.");
    }

    if (!window.fastspring?.builder) {
      throw new Error("FastSpring SBL not loaded. Check index.html script tag.");
    }

    // Format items for secure payload (backend expects product + price + label)
    const formattedItems = items.map((item) => ({
      product: item.product,  // Must match FastSpring Dashboard Path exactly
      quantity: item.quantity || 1,
      price: item.price,
      label: item.label,
    }));


    // Get server-signed secure payload
    const { data } = await axios.post(
      `${BASE_URL}/api/payment/fastspring/secure-payload`,
      { items: formattedItems, productData },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Cookies.get("userAccessToken")}`,
        },
      }
    );

    const { securePayload, secureKey } = data;
    if (!securePayload || !secureKey) {
      throw new Error("Server returned empty securePayload or secureKey.");
    }

    // Apply security signature — this sets the cart with signed prices
    window.fastspring.builder.secure(securePayload, secureKey);

    // Open the popup — NO push() needed; the secure payload already has the cart
    // Small delay ensures secure() is processed before checkout() opens
    setTimeout(() => window.fastspring.builder.checkout(), 150);
  };

  return { pushToFastSpring };
};

export default useFastSpringGateway;
