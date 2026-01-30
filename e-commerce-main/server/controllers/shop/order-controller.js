import Stripe from "stripe";
import dotenv from "dotenv";
import Order from "../../models/Order.js";
import Cart from "../../models/Cart.js";
import Product from "../../models/Product.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Create Stripe Checkout Session & save order
export const createOrder = async (req, res) => {
  try {
    const {
      userId,
      cartItems,
      addressInfo,
      orderStatus,
      paymentMethod,
      paymentStatus,
      totalAmount,
      orderDate,
      orderUpdateDate,
      cartId,
    } = req.body;

    // 1️⃣ Save order in DB (payment pending)
    const newlyCreatedOrder = new Order({
      userId,
      cartId,
      cartItems,
      addressInfo,
      orderStatus: "pending",
      paymentMethod: "stripe",
      paymentStatus: "pending",
      totalAmount,
      orderDate,
      orderUpdateDate,
    });

    await newlyCreatedOrder.save();

    // 2️⃣ Create Stripe Checkout Session
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: cartItems.map((item) => ({
        price_data: {
          currency: "usd",
          product_data: {
            name: item.title,
          },
          unit_amount: Math.round(item.price * 100), // in cents
        },
        quantity: item.quantity,
      })),
      mode: "payment",
      success_url: `${process.env.CLIENT_URL}/shop/stripe-success?orderId=${newlyCreatedOrder._id}`,
      cancel_url: `${process.env.CLIENT_URL}/shop/payment-failed`,
    });

    res.status(201).json({
      success: true,
      sessionId: session.id,
      orderId: newlyCreatedOrder._id,
    });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Stripe order creation failed" });
  }
};

// Capture payment after Stripe webhook or success redirect
export const capturePayment = async (req, res) => {
  try {
    const { orderId, paymentIntentId } = req.body;

    const order = await Order.findById(orderId);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });

    // Payment confirmed
    order.paymentStatus = "paid";
    order.orderStatus = "confirmed";
    order.paymentId = paymentIntentId;

    // Reduce stock
    for (let item of order.cartItems) {
      const product = await Product.findById(item.productId);
      if (product) {
        product.totalStock -= item.quantity;
        await product.save();
      }
    }

    // Delete cart
    await Cart.findByIdAndDelete(order.cartId);

    await order.save();

    res
      .status(200)
      .json({ success: true, message: "Order confirmed", data: order });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Payment capture failed" });
  }
};

// Get all orders for a user
export const getAllOrdersByUser = async (req, res) => {
  try {
    const { userId } = req.params;
    const orders = await Order.find({ userId });
    if (!orders.length)
      return res
        .status(404)
        .json({ success: false, message: "No orders found" });
    res.status(200).json({ success: true, data: orders });
  } catch (error) {
    console.log(error);
    res.status(500).json({ success: false, message: "Fetching orders failed" });
  }
};

// Get order details
export const getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const order = await Order.findById(id);
    if (!order)
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    res.status(200).json({ success: true, data: order });
  } catch (error) {
    console.log(error);
    res
      .status(500)
      .json({ success: false, message: "Fetching order details failed" });
  }
};
