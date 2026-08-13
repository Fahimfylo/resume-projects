// src/api/mutations.js
import axios from "axios";
import Cookies from "js-cookie";

import API_CONFIG from "../utils/apiConstant";

const BASE_URL = API_CONFIG.API_ENDPOINT;

// User registration
export const registerUser = async (user) => {
  try {
    const response = await axios.post(`${BASE_URL}/api/auth/register`, user, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    if (response.status !== 201) {
      throw new Error("Failed to register user");
    }
    return response.data;
  } catch (error) {
    // console.error("Error:", error);
    throw error;
  }
};

// Save Items to the Database
export const saveItemToDatabase = async ({ savedItems, listNames = [], filters } = {}) => {
  const response = await axios.post(
    `${BASE_URL}/api/saved/add`,
    { savedItems, listNames, filters },
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
      },
    }
  );

  if (response.status !== 200) {
    throw new Error("Failed to save item");
  }

  return response.data;
};

// Save Companies to the Database
export const saveCompaniesToDatabase = async ({ savedItems, listNames = [], filters } = {}) => {
  const token = localStorage.getItem("userAccessToken");

  try {
    const response = await axios.post(
      `${BASE_URL}/api/saved-companies/add`,
      { savedItems, listNames, filters },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to save companies");
    }

    return response.data;
  } catch (error) {
    throw error;
  }
};

// Credit deduction on various types
export const deductCredits = async ({ type, quantity }) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/credits/deduct`,
      { type, quantity },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to deduct credits");
    }

    return response.data;
  } catch (error) {
    // console.error("Error deducting credits:", error);
    // Preserve the full error response for the component to handle
    const enhancedError = new Error(
      error.response?.data?.message || "Error deducting credits."
    );
    enhancedError.response = error.response;
    throw enhancedError;
  }
};

// List Save
const getAuthToken = () =>
  localStorage.getItem("userAccessToken") || Cookies.get("userAccessToken");

export const saveList = async (listName, items = [], folderId = null, type = "contacts") => {
  try {
    const token = getAuthToken();

    const payload = { list: { name: listName, items, type } };
    if (folderId) {
      payload.list.folderId = folderId;
    }

    const response = await axios.post(
      `${BASE_URL}/api/list/add`,
      payload,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to save list");
    }

    return response.data;
  } catch (error) {
    // console.error("Error:", error);
    throw error;
  }
};

// Update a list (e.g. assign to a folder)
export const updateList = async (listId, updates) => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error("Missing access token");
    }

    const response = await axios.patch(
      `${BASE_URL}/api/list/${listId}`,
      updates,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status !== 200) {
      throw new Error("Failed to update list");
    }

    return response.data;
  } catch (error) {
    // console.error("Error updating list:", error);
    throw error;
  }
};

// Delete a list by ID
export const deleteList = async (listId) => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error("Missing access token");
    }

    const response = await axios.delete(`${BASE_URL}/api/list/${listId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (![200, 204].includes(response.status)) {
      throw new Error("Failed to delete list");
    }

    return response.data;
  } catch (error) {
    // console.error("Error deleting list:", error);
    throw error;
  }
};

// Create a folder
export const createFolder = async (folderName) => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error("Missing access token");
    }

    const response = await axios.post(
      `${BASE_URL}/api/list/folder`,
      { name: folderName },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      },
    );

    if (response.status !== 200) {
      throw new Error("Failed to create folder");
    }

    return response.data;
  } catch (error) {
    // console.error("Error creating folder:", error);
    throw error;
  }
};

// Delete a folder by ID
export const deleteFolder = async (folderId) => {
  try {
    const token = getAuthToken();

    if (!token) {
      throw new Error("Missing access token");
    }

    const response = await axios.delete(`${BASE_URL}/api/list/folder/${folderId}`, {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
    });

    if (![200, 204].includes(response.status)) {
      throw new Error("Failed to delete folder");
    }

    return response.data;
  } catch (error) {
    // console.error("Error deleting folder:", error);
    throw error;
  }
};

// Save items in to the lists
export const saveItemToList = async (itemIds, listIds) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/list/add-item`,
      { itemIds, listIds },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to save item to list");
    }

    return response.data;
  } catch (error) {
    // console.error("Error:", error);
    throw error;
  }
};

// Save search state for sharing
export const saveSearchShareState = async (filters, excludedFilters, visibleColumns) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/search/save-share-state`,
      { filters, excludedFilters, visibleColumns },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to save share state");
    }

    return response.data;
  } catch (error) {
    // console.error("Error:", error);
    throw error;
  }
};

// Load shared search state (for deep linking)
export const getSharedSearchState = async (shareId) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/search/share-state/${shareId}`);

    if (response.status !== 200) {
      throw new Error("Failed to load shared search state");
    }

    return response.data;
  } catch (error) {
    // console.error("Error loading shared search state:", error);
    throw error;
  }
};

// Update user profile
export const getCurrentUser = async () => {
  try {
    const response = await axios.get(`${BASE_URL}/api/users/me`, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
      },
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch current user");
    }

    return response.data;
  } catch (error) {
    // console.error("Error fetching current user:", error);
    throw error;
  }
};

export const getUsers = async (page = 1, limit = 10) => {
  try {
    const response = await axios.get(`${BASE_URL}/api/users`, {
      params: { page, limit },
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
      },
    });

    if (response.status !== 200) {
      throw new Error("Failed to fetch users");
    }

    return response.data;
  } catch (error) {
    // console.error("Error fetching users:", error);
    throw error;
  }
};

export const updateUserProfile = async (userId, userData) => {
  try {
    const response = await axios.put(
      `${BASE_URL}/api/users/update/${userId}`,
      userData,
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to update user profile");
    }

    return response.data;
  } catch (error) {
    // console.error("Error updating user profile:", error);
    throw error;
  }
};

export const uploadProfilePicture = async (file, userId) => {
  try {
    const formData = new FormData();
    formData.append("photo", file);

    const response = await axios.post(`${BASE_URL}/api/users/upload-profile-picture/${userId}`, formData, {
      headers: {
        Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
      },
    });

    if (response.status !== 200) {
      throw new Error("Failed to upload profile picture");
    }

    return response.data;
  } catch (error) {
    // console.error("Error uploading profile picture:", error);
    throw error;
  }
};

export const deleteUserAccount = async (userId) => {
  try {
    const response = await axios.delete(
      `${BASE_URL}/api/users/delete/${userId}`,
      {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("userAccessToken")}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to delete user account");
    }

    return response.data;
  } catch (error) {
    // console.error("Error deleting user account:", error);
    throw error;
  }
};

// Forgot password - request reset link
export const forgotPassword = async (email) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/forgot-password`,
      { email },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to process forgot password request");
    }

    return response.data;
  } catch (error) {
    // console.error("Error requesting password reset:", error);
    throw error;
  }
};

// Reset password - use token to set new password
export const resetPassword = async (token, newPassword) => {
  try {
    const response = await axios.post(
      `${BASE_URL}/api/auth/reset-password`,
      { token, newPassword },
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to reset password");
    }

    return response.data;
  } catch (error) {
    // console.error("Error resetting password:", error);
    throw error;
  }
};

// Set password (for authenticated users who don't have a password yet)
export const setPassword = async (password, confirmPassword, otp) => {
  try {
    const token = localStorage.getItem("userAccessToken");
    const response = await axios.post(
      `${BASE_URL}/api/auth/set-password`,
      { password, confirmPassword, otp },
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to set password");
    }

    return response.data;
  } catch (error) {
    // console.error("Error setting password:", error);
    throw error;
  }
};

// Request OTP for setting password
export const requestSetPasswordOtp = async () => {
  try {
    const token = localStorage.getItem("userAccessToken");
    const response = await axios.post(
      `${BASE_URL}/api/auth/request-set-password-otp`,
      {},
      {
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Failed to request OTP");
    }

    return response.data;
  } catch (error) {
    // console.error("Error requesting set-password OTP:", error);
    throw error;
  }
};
