import { orderRepository } from './order.repository';
import { notFound, badRequest } from '../../common/errors/HttpError';
import mongoose from 'mongoose';
import type { IOrder } from './order.model';

export const orderService = {
  async create(data: Partial<IOrder>): Promise<IOrder> {
    return orderRepository.create(data);
  },

  async getMyOrders(userId: string): Promise<IOrder[]> {
    return orderRepository.findByUserId(userId);
  },

  async getById(id: string): Promise<IOrder> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw badRequest('Invalid order ID');
    }
    const order = await orderRepository.findById(id);
    if (!order) throw notFound('Order not found');
    return order;
  },

  async getAll(): Promise<IOrder[]> {
    return orderRepository.findAll();
  },

  async updateStatus(id: string, orderStatus: string): Promise<IOrder> {
    if (!mongoose.Types.ObjectId.isValid(id)) {
      throw badRequest('Invalid order ID');
    }
    const order = await orderRepository.updateOrderStatus(id, orderStatus);
    if (!order) throw notFound('Order not found');
    return order;
  },
};
