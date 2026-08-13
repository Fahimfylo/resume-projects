import type { Request, Response } from 'express';
import { asyncHandler } from '../../common/middleware/asyncHandler';
import { sendSuccess, sendCreated } from '../../common/responses/apiResponse';
import { tableService } from './table.service';

export const tableController = {
  create: asyncHandler(async (req: Request, res: Response) => {
    const { tableNo, seats } = req.body;
    const table = await tableService.create(tableNo, seats);
    sendCreated(res, table, 'Table added');
  }),

  getAll: asyncHandler(async (_req: Request, res: Response) => {
    const tables = await tableService.getAll();
    sendSuccess(res, tables);
  }),

  update: asyncHandler(async (req: Request, res: Response) => {
    const { status, orderId } = req.body;
    const table = await tableService.update(req.params.id, status, orderId);
    sendSuccess(res, table, 'Table updated');
  }),
};
