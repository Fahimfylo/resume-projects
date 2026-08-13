import { User, type IUser } from './user.model';

export const userRepository = {
  async findById(id: string): Promise<IUser | null> {
    return User.findById(id);
  },

  async findByIdWithPassword(id: string): Promise<IUser | null> {
    return User.findById(id).select('+password');
  },

  async findByEmail(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() });
  },

  async findByEmailWithPassword(email: string): Promise<IUser | null> {
    return User.findOne({ email: email.toLowerCase() }).select('+password');
  },

  async create(data: Partial<IUser>): Promise<IUser> {
    return User.create(data);
  },

  async update(id: string, data: Partial<IUser>): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  async softDelete(id: string): Promise<IUser | null> {
    return User.findByIdAndUpdate(id, { deletedAt: new Date(), isActive: false }, { new: true });
  },

  async existsByEmail(email: string): Promise<boolean> {
    return User.exists({ email: email.toLowerCase() }).then(Boolean);
  },

  async countByRole(role: string): Promise<number> {
    return User.countDocuments({ role });
  },

  async findAll(
    filter: Record<string, unknown> = {},
    options: { page?: number; limit?: number; sort?: Record<string, 1 | -1> } = {}
  ): Promise<{ users: IUser[]; total: number }> {
    const { page = 1, limit = 10, sort = { createdAt: -1 } } = options;
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).sort(sort).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { users, total };
  },
};
