import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "./apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;
export const fetchItemDetails = async (itemIds) => {
  const token = localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");
  try {
    const response = await axios.post(
      `${BASE_URL}/api/search/ids`,
      { itemIds: itemIds },
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );
    if (response.status !== 200) {
      throw new Error("Failed to fetch item details");
    }
    const data = response.data.results;

    return data;
  } catch (error) {
    // console.error("Error fetching item details:", error);
    throw error;
  }
};
