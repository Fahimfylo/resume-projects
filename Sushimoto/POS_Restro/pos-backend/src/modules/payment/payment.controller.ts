import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler';
import { sendSuccess } from '../../common/responses/apiResponse';
import { paymentService } from './payment.service';

export const paymentController = {
  listPayments: asyncHandler(async (req: Request, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const result = await paymentService.listPayments(page, limit);
    sendSuccess(res, result, 'Payments retrieved');
  }),
  createOrder: asyncHandler(async (req: Request, res: Response) => {
    const { amount } = req.body;
    const order = await paymentService.createOrder(amount);
    sendSuccess(res, order, 'Razorpay order created');
  }),

  verifyPayment: asyncHandler(async (req: Request, res: Response) => {
    const isValid = paymentService.verifyPayment(req.body);
    if (isValid) {
      sendSuccess(res, null, 'Payment verified successfully');
    } else {
      res.status(400).json({ success: false, message: 'Payment verification failed' });
    }
  }),

  webhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers['x-razorpay-signature'] as string;
    const result = await paymentService.handleWebhook(req.body, signature);
    res.json(result);
  }),
};
