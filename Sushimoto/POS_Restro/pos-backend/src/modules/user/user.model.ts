import mongoose, { Schema, type Document } from 'mongoose';
import { hashPassword } from '../../common/utils/password';
import type { Role } from './user.constants';
import { Roles } from './user.constants';

export interface IUserAddress {
  label: string;
  street: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  isDefault: boolean;
}

export interface IUserPreferences {
  favoriteCategories: string[];
  favoriteFoods: string[];
  notifications: {
    email: boolean;
    sms: boolean;
    push: boolean;
  };
}

export interface ILoyalty {
  points: number;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
  rewards: string[];
}

export interface IUser extends Document {
  name: string;
  email: string;
  phone?: string;
  password: string;
  role: Role;
  avatar?: string;
  birthday?: Date;
  gender?: 'male' | 'female' | 'other' | 'prefer-not-to-say';
  addresses: IUserAddress[];
  emailVerified: boolean;
  refreshTokenHash?: string;
  lastLogin?: Date;
  lastPasswordChange?: Date;
  failedLoginAttempts: number;
  accountLockedUntil?: Date;
  preferences: IUserPreferences;
  loyalty: ILoyalty;
  isActive: boolean;
  deletedAt?: Date;

  isLocked(): boolean;
  isProfileComplete(): boolean;
  incrementFailedAttempts(): Promise<void>;
  resetFailedAttempts(): Promise<void>;
}

const addressSchema = new Schema<IUserAddress>(
  {
    label: { type: String, default: 'Home' },
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'US' },
    isDefault: { type: Boolean, default: false },
  },
  { _id: false }
);

const preferencesSchema = new Schema<IUserPreferences>(
  {
    favoriteCategories: { type: [String], default: [] },
    favoriteFoods: { type: [String], default: [] },
    notifications: {
      email: { type: Boolean, default: true },
      sms: { type: Boolean, default: false },
      push: { type: Boolean, default: true },
    },
  },
  { _id: false }
);

const loyaltySchema = new Schema<ILoyalty>(
  {
    points: { type: Number, default: 0 },
    tier: {
      type: String,
      enum: ['bronze', 'silver', 'gold', 'platinum'],
      default: 'bronze',
    },
    rewards: { type: [String], default: [] },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    name: { type: String, required: true, trim: true },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    phone: { type: String, trim: true },
    password: { type: String, required: true, select: false },
    role: {
      type: String,
      enum: Object.values(Roles),
      default: Roles.CUSTOMER,
    },
    avatar: { type: String },
    birthday: { type: Date },
    gender: {
      type: String,
      enum: ['male', 'female', 'other', 'prefer-not-to-say'],
    },
    addresses: { type: [addressSchema], default: [] },
    emailVerified: { type: Boolean, default: false },
    refreshTokenHash: { type: String, select: false },
    lastLogin: { type: Date },
    lastPasswordChange: { type: Date },
    failedLoginAttempts: { type: Number, default: 0 },
    accountLockedUntil: { type: Date },
    preferences: { type: preferencesSchema, default: () => ({}) },
    loyalty: { type: loyaltySchema, default: () => ({}) },
    isActive: { type: Boolean, default: true },
    deletedAt: { type: Date, default: null },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.password;
        delete ret.refreshTokenHash;
        delete ret.__v;
        return ret;
      },
    },
  }
);

userSchema.index({ email: 1, isActive: 1 });
userSchema.index({ role: 1 });

userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await hashPassword(this.password);
  next();
});

userSchema.methods.isLocked = function (): boolean {
  if (!this.accountLockedUntil) return false;
  return this.accountLockedUntil > new Date();
};

userSchema.methods.isProfileComplete = function (): boolean {
  return !!this.phone && this.addresses.length > 0;
};

userSchema.methods.incrementFailedAttempts = async function (): Promise<void> {
  this.failedLoginAttempts += 1;
  if (this.failedLoginAttempts >= 5) {
    this.accountLockedUntil = new Date(Date.now() + 15 * 60 * 1000);
  }
  await this.save();
};

userSchema.methods.resetFailedAttempts = async function (): Promise<void> {
  this.failedLoginAttempts = 0;
  this.accountLockedUntil = undefined;
  await this.save();
};

userSchema.pre(/^find/, function (this) {
  this.where({ deletedAt: null });
});

export const User = mongoose.model<IUser>('User', userSchema);
