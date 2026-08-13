import { Order, type IOrder } from './order.model';

export const orderRepository = {
  async create(data: Partial<IOrder>): Promise<IOrder> {
    return Order.create(data);
  },

  async findById(id: string): Promise<IOrder | null> {
    return Order.findById(id);
  },

  async findAll(): Promise<IOrder[]> {
    return Order.find().populate('table').sort({ createdAt: -1 });
  },

  async findByUserId(userId: string): Promise<IOrder[]> {
    return Order.find({ user: userId }).sort({ createdAt: -1 });
  },

  async updateOrderStatus(id: string, orderStatus: string): Promise<IOrder | null> {
    return Order.findByIdAndUpdate(id, { orderStatus }, { new: true });
  },
};
