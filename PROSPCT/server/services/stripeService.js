const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);
const transactionService = require("./transactionService");

const createPaymentIntent = async (items) => {
  const lineItems = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: { name: item.name },
      unit_amount: item.price * 100,
    },
    quantity: item.quantity || 1,
  }));

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items: lineItems,
    mode: "payment",
    success_url: process.env.SUCCESS_URL,
    cancel_url: process.env.CANCEL_URL,
  });
};

const handleWebhook = async (signature, body) => {
  const event = stripe.webhooks.constructEvent(
    body,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET
  );

  switch (event.type) {
    case "checkout.session.completed":
      const session = event.data.object;
      const transactionId = session.metadata?.transactionId;
      if (transactionId) {
        try {
          const transaction = await transactionService.updateTransactionStatus(
            transactionId,
            "COMPLETED",
            session
          );
          if (transaction) {
            await transactionService.applyTransactionBenefits(
              transaction.userId,
              transaction
            );
          }
        } catch (err) {
          console.error("[Stripe Webhook] Fulfillment error:", err);
        }
      }
      break;

    default:
  }

  return event;
};

const createCheckoutSession = async (items, metadata = {}) => {
  const line_items = items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
      },
      unit_amount: Math.round(item.price * 100),
    },
    quantity: item.quantity || 1,
  }));

  return await stripe.checkout.sessions.create({
    payment_method_types: ["card"],
    line_items,
    mode: "payment",
    success_url: process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/dashboard`
      : "http://localhost:5173/dashboard",
    cancel_url: process.env.FRONTEND_URL
      ? `${process.env.FRONTEND_URL}/plans-and-billings`
      : "http://localhost:5173/plans-and-billings",
    metadata,
  });
};

module.exports = { createPaymentIntent, createCheckoutSession, handleWebhook };
