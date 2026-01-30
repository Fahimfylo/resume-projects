import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";
import axios from "axios";

const initialState = {
  sessionId: null, // ✅ Stripe sessionId
  isLoading: false,
  orderId: null,
  orderList: [],
  orderDetails: null,
};

// ✅ Create new order (Stripe Checkout Session)
export const createNewOrder = createAsyncThunk(
  "/order/createNewOrder",
  async (orderData) => {
    const token = localStorage.getItem("authToken"); // JWT token
    const response = await axios.post(
      `${import.meta.env.VITE_SERVER_URL}/api/shop/order/create`,
      orderData,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );
    return response.data;
  }
);

// ✅ Capture Stripe payment
export const capturePayment = createAsyncThunk(
  "/order/capturePayment",
  async ({ paymentIntentId, orderId }) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.post(
      `${import.meta.env.VITE_SERVER_URL}/api/shop/order/capture`,
      { paymentIntentId, orderId },
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );
    return response.data;
  }
);

// ✅ Get all orders by user ID
export const getAllOrdersByUserId = createAsyncThunk(
  "/order/getAllOrdersByUserId",
  async (userId) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
      `${import.meta.env.VITE_SERVER_URL}/api/shop/order/list/${userId}`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );
    return response.data;
  }
);

// ✅ Get specific order details
export const getOrderDetails = createAsyncThunk(
  "/order/getOrderDetails",
  async (id) => {
    const token = localStorage.getItem("authToken");
    const response = await axios.get(
      `${import.meta.env.VITE_SERVER_URL}/api/shop/order/details/${id}`,
      {
        headers: {
          Authorization: token ? `Bearer ${token}` : "",
        },
      }
    );
    return response.data;
  }
);

const shoppingOrderSlice = createSlice({
  name: "shoppingOrderSlice",
  initialState,
  reducers: {
    resetOrderDetails: (state) => {
      state.orderDetails = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // ✅ Create order reducers
      .addCase(createNewOrder.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(createNewOrder.fulfilled, (state, action) => {
        state.isLoading = false;
        state.sessionId = action.payload.id; // Stripe session ID
        state.orderId = action.payload.orderId;

        // session storage এ orderId save করা
        sessionStorage.setItem(
          "currentOrderId",
          JSON.stringify(action.payload.orderId)
        );
      })
      .addCase(createNewOrder.rejected, (state) => {
        state.isLoading = false;
        state.sessionId = null;
        state.orderId = null;
      })

      // ✅ Get all orders
      .addCase(getAllOrdersByUserId.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getAllOrdersByUserId.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderList = action.payload.data;
      })
      .addCase(getAllOrdersByUserId.rejected, (state) => {
        state.isLoading = false;
        state.orderList = [];
      })

      // ✅ Get order details
      .addCase(getOrderDetails.pending, (state) => {
        state.isLoading = true;
      })
      .addCase(getOrderDetails.fulfilled, (state, action) => {
        state.isLoading = false;
        state.orderDetails = action.payload.data;
      })
      .addCase(getOrderDetails.rejected, (state) => {
        state.isLoading = false;
        state.orderDetails = null;
      });
  },
});

export const { resetOrderDetails } = shoppingOrderSlice.actions;
export default shoppingOrderSlice.reducer;
