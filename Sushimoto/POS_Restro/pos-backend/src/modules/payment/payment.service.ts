import Razorpay from 'razorpay';
import crypto from 'crypto';
import { env } from '../../config/env';
import { paymentRepository } from './payment.repository';
import { badRequest } from '../../common/errors/HttpError';
import { logger } from '../../config/logger';

function getRazorpayInstance(): Razorpay {
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID,
    key_secret: env.RAZORPAY_KEY_SECRET,
  });
}

export const paymentService = {
  async listPayments(page = 1, limit = 20) {
    return paymentRepository.findAll({}, { page, limit, sort: { createdAt: -1 } });
  },
  async createOrder(amount: number) {
    const razorpay = getRazorpayInstance();
    const options = {
      amount: amount * 100,
      currency: 'INR',
      receipt: `receipt_${Date.now()}`,
    };
    const order = await razorpay.orders.create(options);
    return order;
  },

  verifyPayment(data: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): boolean {
    const expectedSignature = crypto
      .createHmac('sha256', env.RAZORPAY_KEY_SECRET)
      .update(data.razorpay_order_id + '|' + data.razorpay_payment_id)
      .digest('hex');

    return expectedSignature === data.razorpay_signature;
  },

  async handleWebhook(body: Record<string, unknown>, signature: string | undefined) {
    const secret = env.RAZORPAY_WEBHOOK_SECRET;
    if (!secret) {
      throw badRequest('Webhook secret not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(JSON.stringify(body))
      .digest('hex');

    if (expectedSignature !== signature) {
      throw badRequest('Invalid webhook signature');
    }

    if ((body as any).event === 'payment.captured') {
      const payment = (body as any).payload.payment.entity;
      logger.info({ amount: payment.amount / 100 }, 'Payment captured');

      await paymentRepository.create({
        paymentId: payment.id,
        orderId: payment.order_id,
        amount: payment.amount / 100,
        currency: payment.currency,
        status: payment.status,
        method: payment.method,
        email: payment.email,
        contact: payment.contact,
        createdAt: new Date(payment.created_at * 1000),
      });
    }

    return { success: true };
  },
};
