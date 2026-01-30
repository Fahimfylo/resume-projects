import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  isLoading: false,
  reviews: [],
};

// Add review
export const addReview = createAsyncThunk(
  "/order/addReview",
  async (formdata) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${import.meta.env.VITE_SERVER_URL}/api/shop/review/add`,
      formdata,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );

    return response.data;
  }
);

// Get reviews for a product/order
export const getReviews = createAsyncThunk("/order/getReviews", async (id) => {
  const token = localStorage.getItem("authToken");
  const response = await axios.get(
    `${import.meta.env.VITE_SERVER_URL}/api/shop/review/${id}`,
    {
      headers: {
        Authorization: token ? `Bearer ${token}` : "",
      },
    }
  );

  return response.data;
});

const reviewSlice = createSlice({
  name: "reviewSlice",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(getReviews.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getReviews.fulfilled, (state, action) => {
        state.isLoading = false;
        state.reviews = action.payload.data;
      })
      .addCase(getReviews.rejected, (state) => {
        state.isLoading = false;
        state.reviews = [];
      });
  },
});

export default reviewSlice.reducer;
