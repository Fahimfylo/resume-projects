const stripeService = require("../services/stripeService");
const payProGlobalService = require("../services/payProGlobalService");
const coinPaymentService = require("../services/coinPaymentService");
const heleketService = require("../services/heleketService");
const fastSpringService = require("../services/fastSpringService");
const transactionService = require("../services/transactionService");
const Transaction = require("../models/Transaction");
const User = require("../models/User");
const FastSpringEvent = require("../models/FastSpringEvent");

const paymentController = {
  // ---------------------- STRIPE ----------------------
  stripeCreateCheckoutSession: async (req, res) => {
    try {
      const productData = req.body;
      const userId = req.user.userId;

      const totalAmount = productData.reduce(
        (acc, item) => acc + Number(item.price),
        0,
      );

      const transaction = await transactionService.createTransaction({
        userId,
        totalAmount,
        paymentGateway: "Stripe",
        items: productData,
      });

      const items = productData.map((item) => ({
        name: item.name,
        price: Number(item.price),
        quantity: 1,
      }));

      const session = await stripeService.createCheckoutSession(items, {
        transactionId: transaction._id.toString(),
      });

      await Transaction.findByIdAndUpdate(transaction._id, {
        "paymentGateway.transactionId": session.id,
      });

      res.json({ id: session.id, url: session.url });
    } catch (error) {
      console.error("Stripe Checkout Error:", error);
      res.status(500).json({ error: "Stripe payment processing error" });
    }
  },

  stripeWebhook: async (req, res) => {
    try {
      await stripeService.handleWebhook(
        req.headers["stripe-signature"],
        req.body,
      );
      res.status(200).send({ received: true });
    } catch (error) {
      res.status(400).send({ error: `Webhook Error: ${error.message}` });
    }
  },

  // ---------------------- FASTSPRING ----------------------
  fastSpringCheckout: async (req, res) => {
    try {
      const { productData, totalAmount, coupon } = req.body;
      const userId = req.user.userId;

      // Create transaction record
      const transaction = await transactionService.createTransaction({
        userId,
        totalAmount: Number(totalAmount),
        paymentGateway: "FastSpring",
        status: "PENDING",
        items: productData,
        coupon: coupon?.code || null,
      });

      // Create Fast Spring checkout session
      const checkoutSession = await fastSpringService.createCheckoutSession(
        transaction._id.toString(),
        productData,
        req.user.email,
        `${process.env.FRONTEND_URL}/billing/success?transactionId=${transaction._id}`
      );

      res.json({
        checkoutUrl: checkoutSession.checkoutUrl,
        orderId: checkoutSession.orderId,
        transactionId: transaction._id,
      });
    } catch (error) {
      console.error("FastSpring Checkout Error:", error);
      res.status(500).json({
        error: error.message || "FastSpring checkout failed",
      });
    }
  },

  fastSpringWebhook: async (req, res) => {
    try {
      const signature = req.headers["x-fs-signature"] || req.headers["x-fastspring-signature"];
      const rawBody = req.rawBody;

      const isValid = fastSpringService.validateWebhookSignature(signature, rawBody);

      if (!isValid) {
        console.warn("[SECURITY] FastSpring: Invalid webhook signature detected");
        return res.status(400).json({ error: "Invalid signature" });
      }

      res.json({ received: true });

      const events = req.body.events || [];
      const fastSpringQueue = require('../queues/fastSpringQueue');

      for (const event of events) {
        if (event.id) {
          try {
            await FastSpringEvent.create({
              eventId: event.id,
              eventType: event.type,
            });
          } catch (dbError) {
            if (dbError.code === 11000) {
              continue;
            }
            throw dbError;
          }
        }

        try {
          await fastSpringQueue.add({ event });
        } catch (queueError) {
          console.error(`[FastSpring] Inline processing failed for event ${event.id}:`, queueError.message);
        }
      }
    } catch (error) {
      console.error("FastSpring Webhook Error:", error);
    }
  },

  // ---------------------- FASTSPRING SECURE PAYLOAD ----------------------
  fastSpringSecurePayload: async (req, res) => {
    try {
      const { items, productData } = req.body;
      const userId = req.user.userId;

      if (!items || !Array.isArray(items) || items.length === 0) {
        return res.status(400).json({ error: "items array is required" });
      }

      const user = await User.findById(userId).select("email firstName lastName");
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Create a pending transaction BEFORE generating the secure payload
      // so the webhook can match and fulfill it when payment succeeds.
      const data = productData && productData.length > 0
        ? productData
        : items.map((item) => ({
            name: item.product,
            price: item.price,
            type: "Plan",
            quantity: item.quantity || 1,
          }));

      const totalAmount = data.reduce(
        (acc, item) => acc + Number(item.price),
        0,
      );

      const transaction = await transactionService.createTransaction({
        userId,
        totalAmount,
        paymentGateway: "FastSpring",
        items: data,
      });

      const { securePayload, secureKey } = fastSpringService.generateSecurePayload(
        items,
        user.email,
        user.firstName,
        user.lastName
      );

      res.json({
        securePayload,
        secureKey,
        transactionId: transaction._id,
      });
    } catch (error) {
      console.error("FastSpring Secure Payload Error:", error.message);
      res.status(500).json({ error: "Failed to generate secure payload" });
    }
  },

  // ---------------------- COINPAYMENTS ----------------------
  createCoinPaymentsPayment: async (req, res) => {
    try {
      const { amount, currency, email, item_name } = req.body;

      const payment = await coinPaymentService.createCoinPayment({
        amount,
        currency,
        email,
        item_name,
      });

      res.json(payment);
    } catch (err) {
      console.error("CoinPayments Error:", err);
      res.status(500).json({ error: "Error creating CoinPayments payment" });
    }
  },

  coinpaymentsIPN: async (req, res) => {
    res.json({ received: true });
  },

  // ---------------------- HELEKET (FIXED) ----------------------
  heleketCheckout: async (req, res) => {
    try {
      const { productData } = req.body;
      const userId = req.user.userId;
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

      const totalAmount = productData.reduce(
        (acc, item) => acc + Number(item.price),
        0,
      );

      const transaction = await transactionService.createTransaction({
        userId,
        totalAmount,
        paymentGateway: "HELEKET",
        status: "PENDING",
        items: productData,
      });

      const paymentUrl = await heleketService.createHeleketPayment({
        amount: totalAmount,
        orderId: transaction._id.toString(),
        email: req.user.email,
        successUrl: `${frontendUrl}/billing/success`,
        failUrl: `${frontendUrl}/billing/cancel`,
        callbackUrl: `${process.env.BACKEND_URL}/api/payment/heleket/ipn`,
      });

      res.json({ url: paymentUrl }); // ✅ JSON response
    } catch (err) {
      console.error("Heleket Checkout Error:", err.message);
      res.status(500).json({ error: err.message });
    }
  },

  heleketIPN: async (req, res) => {
    try {
      // 1. Signature Enforcement — use raw body string for hash integrity
      const signature = req.headers["x-heleket-signature"] || req.headers["sign"];

      const isValid = heleketService.validateHeleketSignature(
        signature,
        req.rawBody,
      );

      const bodyData = req.body;

      if (!isValid) {
        console.warn("[SECURITY] Heleket IPN: 401 Unauthorized signature attempt");
        return res.status(401).send("Unauthorized");
      }

      const { order_id, status, payment_amount, uuid, txid } = bodyData;

      // Log the uuid and txid provided by Heleket for audit trails

      // 2. Data Selection: Use Transaction model with findById
      const transaction = await Transaction.findById(order_id);
      
      if (!transaction) {
        console.error(`Heleket IPN Error: Transaction ${order_id} not found`);
        return res.status(404).send("Transaction not found");
      }

      // 3. Idempotency Check
      if (transaction.status === "COMPLETED") {
        return res.status(200).send("OK");
      }

      // 4. Integrity Check: Amount Validation
      if (Number(payment_amount) < Number(transaction.totalAmount)) {
        console.warn(`[WARNING] Heleket IPN: Insufficient amount for Order ${order_id}. Expected ${transaction.totalAmount}, received ${payment_amount}`);
        return res.status(400).send("Insufficient Amount");
      }

      // 5. Status Mapping & Logic
      let mappedStatus = transaction.status;
      if (status === "paid" || status === "paid_over") {
        mappedStatus = "COMPLETED";
      } else if (status === "fail" || status === "cancel" || status === "system_fail") {
        mappedStatus = "FAILED";
      } else if (status === "wrong_amount") {
        mappedStatus = "PARTIAL_PAYMENT";
        console.warn(`[WARNING] Heleket IPN: Marked as PARTIAL_PAYMENT for Order ${order_id}. Manual review required.`);
      }

      if (mappedStatus !== transaction.status) {
        const updatedTransaction = await transactionService.updateTransactionStatus(
          order_id,
          mappedStatus,
          bodyData
        );

        if (mappedStatus === "COMPLETED") {
          // 6. Credit Processing Logic (Atomic Update)
          const creditQuantity = transaction.items?.[0]?.credit?.quantity;
          
          if (creditQuantity && typeof creditQuantity === "number" && creditQuantity > 0) {
             await User.findByIdAndUpdate(
               transaction.userId,
               { $inc: { "credits.verificationCredits.current": creditQuantity } }
             );
          }
          
          // Apply any remaining benefits (like plan upgrades) if applicable
          await transactionService.applyTransactionBenefits(
            updatedTransaction.userId,
            updatedTransaction
          );
        }
      }

      // 7. Response Protocol
      res.status(200).send("OK");
    } catch (error) {
      console.error("Heleket IPN Unexpected Error:", error);
      res.status(500).send("Internal Server Error");
    }
  },

  // ---------------------- PAYPROGLOBAL ----------------------
  payProGlobalCheckout: async (req, res) => {
    try {
      const { productData, totalAmount, coupon } = req.body;
      const userId = req.user.userId;

      const transaction = await transactionService.createTransaction({
        userId,
        totalAmount: Number(totalAmount),
        paymentGateway: "PayProGlobal",
        status: "PENDING",
        items: productData,
        coupon: coupon?.code || null,
      });

      const formattedProductsData = productData.map((product) => ({
        Name: product.name,
        "Price[USD][amount]": product.price,
        "x-transaction-id": transaction._id,
        discountpercentage: coupon?.discountPercentage || 0,
      }));

      const dynamicProductUrl = payProGlobalService.createDynamicProductUrl(
        formattedProductsData,
        process.env.PAYPROGLOBAL_ENCRYPTION_KEY,
        process.env.PAYPROGLOBAL_IV,
        "https://store.payproglobal.com/checkout?",
        100072,
        false,
      );

      res.json({ url: dynamicProductUrl });
    } catch (error) {
      console.error("PayProGlobal Error:", error);
      res.status(500).json({ error: "PayProGlobal checkout failed" });
    }
  },

  PayProGlobalIPN: async (req, res) => {
    try {
      const { ORDER_STATUS, ORDER_CUSTOM_FIELDS } = req.body;

      const match = ORDER_CUSTOM_FIELDS.match(/x-transaction-id=(.+)/);
      const transactionId = match ? match[1] : null;

      if (ORDER_STATUS === "Processed" && transactionId) {
        const transaction = await transactionService.updateTransactionStatus(
          transactionId,
          "COMPLETED",
          req.body,
        );

        await transactionService.applyTransactionBenefits(
          transaction.userId,
          transaction,
        );
      }

      res.json({ received: true });
    } catch (error) {
      console.error("PayProGlobal IPN Error:", error);
      res.status(500).json({ error: "Error processing PayProGlobal IPN" });
    }
  },
};

module.exports = paymentController;
