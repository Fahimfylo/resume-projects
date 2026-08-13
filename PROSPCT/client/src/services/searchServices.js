// services/searchServices.js
import axios from "axios";
import Cookies from "js-cookie";
import API_CONFIG from "../utils/apiConstant";

// remove empty entries similar to server
const cleanFiltersObject = (obj) => {
  if (!obj || typeof obj !== "object") return {};
  return Object.fromEntries(
    Object.entries(obj).filter(([key, value]) => {
      if (value == null || value === "") return false;
      if (Array.isArray(value)) return value.length > 0;
      if (typeof value === "object") return Object.keys(value).length > 0;
      return true;
    })
  );
};

// Normal save
export const saveSearch = async (filters, excludedFilters) => {
  try {
    const payload = {
      searchName: "Custom Search",
      filters: cleanFiltersObject(filters),
      excludedFilters: cleanFiltersObject(excludedFilters),
    };
    // POST to the same base route used for GET/DELETE
    const response = await axios.post(
      `${API_CONFIG.API_ENDPOINT}/api/saved-searches`,
      payload,
      { headers: { Authorization: `Bearer ${localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken")}` } },
    );
    return response.status === 200;
  } catch (err) {
    // console.error("saveSearch failed", err.response?.status, err.response?.data || err);
    throw err;
  }
};

// New: Save recent search
export const saveRecentSearch = async (filters, excludedFilters) => {
  try {
    const cleaned = cleanFiltersObject(filters);
    if (Object.keys(cleaned).length === 0) return;

    await axios.post(
      `${API_CONFIG.API_ENDPOINT}/api/recent-searches`,
      { filters: cleaned, excludedFilters: cleanFiltersObject(excludedFilters) },
      { headers: { Authorization: `Bearer ${localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken")}` } },
    );
  } catch (err) {
    // console.error("Failed to save recent search:", err);
  }
};

export const deleteRecentSearch = async (id) => {
  try {
    await axios.delete(`${API_CONFIG.API_ENDPOINT}/api/recent-searches/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken")}` },
    });
    return true;
  } catch (err) {
    // console.error("Failed to delete recent search:", err);
    return false;
  }
};

export const deleteSavedSearch = async (id) => {
  try {
    await axios.delete(`${API_CONFIG.API_ENDPOINT}/api/saved-searches/${id}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken")}` },
    });
    return true;
  } catch (err) {
    // console.error("Failed to delete saved search:", err);
    return false;
  }
};