import { userRepository } from './user.repository';
import { notFound, badRequest, forbidden } from '../../common/errors/HttpError';
import { comparePassword, hashPassword } from '../../common/utils/password';
import { Roles } from './user.constants';
import type { IUser } from './user.model';

export const userService = {
  async getProfile(userId: string): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw notFound('User not found');
    return user;
  },

  async updateProfile(
    userId: string,
    data: Partial<Pick<IUser, 'name' | 'phone' | 'avatar' | 'birthday' | 'gender' | 'preferences'>> & {
      addresses?: IUser['addresses'];
    }
  ): Promise<IUser> {
    const user = await userRepository.update(userId, data as Partial<IUser>);
    if (!user) throw notFound('User not found');
    return user;
  },

  async changePassword(
    userId: string,
    currentPassword: string,
    newPassword: string
  ): Promise<void> {
    const user = await userRepository.findByIdWithPassword(userId);
    if (!user) throw notFound('User not found');

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) throw badRequest('Current password is incorrect');

    user.password = await hashPassword(newPassword);
    user.lastPasswordChange = new Date();
    await user.save();
  },

  async completeProfile(
    userId: string,
    data: {
      phone: string;
      address: IUser['addresses'][0];
    }
  ): Promise<IUser> {
    const user = await userRepository.findById(userId);
    if (!user) throw notFound('User not found');

    user.phone = data.phone;
    user.addresses = [data.address];
    await user.save();
    return user;
  },

  // --- Admin User Management ---
  async adminListUsers(requesterRole: string, page = 1, limit = 20) {
    const filter: Record<string, unknown> = {};
    if (requesterRole === Roles.ADMIN) {
      filter.role = { $ne: Roles.SUPERADMIN };
    }
    return userRepository.findAll(filter, { page, limit, sort: { createdAt: -1 } });
  },

  async adminGetUser(requesterRole: string, targetId: string) {
    const user = await userRepository.findById(targetId);
    if (!user) throw notFound('User not found');
    if (requesterRole === Roles.ADMIN && user.role === Roles.SUPERADMIN) {
      throw forbidden('Cannot access superadmin accounts');
    }
    return user;
  },

  async adminCreateUser(requesterRole: string, data: {
    name: string; email: string; password: string; role: string; phone?: string; avatar?: string;
  }) {
    if (requesterRole === Roles.ADMIN && data.role === Roles.SUPERADMIN) {
      throw forbidden('Cannot create superadmin accounts');
    }
    const existing = await userRepository.findByEmail(data.email);
    if (existing) throw badRequest('Email already in use');
    return userRepository.create(data as Partial<IUser>);
  },

  async adminUpdateUser(requesterRole: string, targetId: string, data: Record<string, unknown>) {
    const target = await userRepository.findById(targetId);
    if (!target) throw notFound('User not found');
    if (requesterRole === Roles.ADMIN && target.role === Roles.SUPERADMIN) {
      throw forbidden('Cannot modify superadmin accounts');
    }
    if (requesterRole === Roles.ADMIN && data.role === Roles.SUPERADMIN) {
      throw forbidden('Cannot assign superadmin role');
    }
    return userRepository.update(targetId, data as Partial<IUser>);
  },

  async adminDeleteUser(requesterRole: string, targetId: string) {
    const target = await userRepository.findById(targetId);
    if (!target) throw notFound('User not found');
    if (requesterRole === Roles.ADMIN && target.role === Roles.SUPERADMIN) {
      throw forbidden('Cannot delete superadmin accounts');
    }
    return userRepository.softDelete(targetId);
  },
};
