import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler';
import { sendSuccess, sendCreated } from '../../common/responses/apiResponse';
import { orderService } from './order.service';

export const orderController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.create(req.body);
    sendCreated(res, order, 'Order created');
  }),

  getMyOrders: asyncHandler(async (req: Request, res: Response) => {
    const orders = await orderService.getMyOrders(req.user!.userId);
    sendSuccess(res, orders);
  }),

  getAll: asyncHandler(async (_req: Request, res: Response) => {
    const orders = await orderService.getAll();
    sendSuccess(res, orders);
  }),

  getById: asyncHandler(async (req: Request, res: Response) => {
    const order = await orderService.getById(req.params.id);
    sendSuccess(res, order);
  }),

  updateStatus: asyncHandler(async (req: Request, res: Response) => {
    const { orderStatus } = req.body;
    const order = await orderService.updateStatus(req.params.id, orderStatus);
    sendSuccess(res, order, 'Order updated');
  }),
};
