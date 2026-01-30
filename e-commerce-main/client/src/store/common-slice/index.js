import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  featureImageList: [],
};

// Get all feature images
export const getFeatureImages = createAsyncThunk(
  "common/getFeatureImages",
  async () => {
    const token = localStorage.getItem("adminToken");
    const response = await axios.get(
      `${import.meta.env.VITE_SERVER_URL}/api/common/feature/get`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );
    return response.data;
  }
);

// Add feature image
export const addFeatureImage = createAsyncThunk(
  "common/addFeatureImage",
  async (imageFile) => {
    const token = localStorage.getItem("adminToken");
    const formData = new FormData();
    formData.append("image", imageFile); // must match route multer field

    const response = await axios.post(
      `${import.meta.env.VITE_SERVER_URL}/api/common/feature/add`,
      formData,
      {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );

    return response.data;
  }
);

const commonSlice = createSlice({
  name: "common",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getFeatureImages.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getFeatureImages.fulfilled, (state, action) => {
        state.isLoading = false;
        state.featureImageList = action.payload.data;
      })
      .addCase(getFeatureImages.rejected, (state) => {
        state.isLoading = false;
        state.featureImageList = [];
      });
  },
});

export default commonSlice.reducer;
