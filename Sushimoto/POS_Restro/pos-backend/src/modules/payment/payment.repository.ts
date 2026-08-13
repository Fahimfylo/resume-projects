import { Payment, type IPayment } from './payment.model';

export const paymentRepository = {
  async create(data: Partial<IPayment>): Promise<IPayment> {
    return Payment.create(data);
  },

  async findAll(
    filter: Record<string, unknown> = {},
    options: { page?: number; limit?: number; sort?: Record<string, 1 | -1> } = {}
  ) {
    const { page = 1, limit = 20, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;
    const [payments, total] = await Promise.all([
      Payment.find(filter).sort(sort).skip(skip).limit(limit),
      Payment.countDocuments(filter),
    ]);
    return { payments, total };
  },
};
