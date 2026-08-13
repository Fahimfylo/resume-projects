import { tableRepository } from './table.repository';
import { notFound, badRequest, conflict } from '../../common/errors/HttpError';
import mongoose from 'mongoose';
import type { ITable } from './table.model';

export const tableService = {
  async create(tableNo: number, seats: number): Promise<ITable> {
    if (!tableNo) throw badRequest('Please provide table number');

    const existing = await tableRepository.findByTableNo(tableNo);
    if (existing) throw conflict('Table already exists');

    return tableRepository.create({ tableNo, seats });
  },

  async getAll(): Promise<ITable[]> {
    return tableRepository.findAll();
  },

  async update(id: string, status?: string, orderId?: string): Promise<ITable> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw badRequest('Invalid table ID');
    }

    const table = await tableRepository.update(id, {
      status: status || 'Available',
      currentOrder: orderId,
    });
    if (!table) throw notFound('Table not found');
    return table;
  },
};
