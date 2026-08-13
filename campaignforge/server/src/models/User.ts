import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  name?: string;
  password?: string;
  businessName: string;
  businessType: string;
  avatarUrl?: string;
  isEmailVerified: boolean;
  authProvider: 'local' | 'google';
  googleId?: string;
  verificationToken?: string;
  verificationTokenExpires?: Date;
  verificationCode?: string;
  verificationCodeExpires?: Date;
  resetPasswordToken?: string;
  resetPasswordExpires?: Date;
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    name: { type: String, trim: true, maxlength: 100 },
    password: {
      type: String,
      minlength: 8,
      select: false,
    },
    businessName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    businessType: {
      type: String,
      default: 'Services',
      trim: true,
    },
    avatarUrl: { type: String },
    isEmailVerified: { type: Boolean, default: false },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    googleId: { type: String, sparse: true },
    verificationToken: { type: String, select: false },
    verificationTokenExpires: { type: Date, select: false },
    verificationCode: { type: String, select: false },
    verificationCodeExpires: { type: Date, select: false },
    resetPasswordToken: { type: String, select: false },
    resetPasswordExpires: { type: Date, select: false },
  },
  { timestamps: true }
);

userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password') || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

userSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.verificationToken;
  delete obj.verificationTokenExpires;
  delete obj.verificationCode;
  delete obj.verificationCodeExpires;
  delete obj.resetPasswordToken;
  delete obj.resetPasswordExpires;
  delete obj.__v;
  return obj;
};

export const User = mongoose.model<IUser>('User', userSchema);
