import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const ROLES = ['SUPER_ADMIN', 'ADMIN', 'MODERATOR', 'TEAM_LEADER', 'VERIFIED_CREATOR', 'PRO_PLAYER', 'USER'];

const userSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: [true, 'Password is required'],
      minlength: 6,
    },
    gamerTag: {
      type: String,
      unique: true,
      sparse: true,
      trim: true,
    },
    gamerBio: {
      type: String,
      default: '',
    },
    avatarUrl: {
      type: String,
      default: '',
    },
    gamingPreferences: {
      type: [String],
      default: [],
    },
    rank: {
      type: String,
      enum: ['NOVICE', 'ELITE', 'MYTHIC', 'LEGEND'],
      default: 'NOVICE',
    },
    level: {
      type: Number,
      default: 1,
    },
    stats: {
      winRate: { type: Number, default: 0 },
      kdRatio: { type: Number, default: 0 },
      matches: { type: Number, default: 0 },
    },
    refreshToken: {
      type: String,
      default: null,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    otpCode: {
      type: String,
      default: null,
    },
    otpExpiresAt: {
      type: Date,
      default: null,
    },
    role: {
      type: String,
      enum: ROLES,
      default: 'USER',
    },
    isBanned: {
      type: Boolean,
      default: false,
    },
    isSuspended: {
      type: Boolean,
      default: false,
    },
    suspensionUntil: {
      type: Date,
      default: null,
    },
    warnings: {
      type: Number,
      default: 0,
    },
    reputationScore: {
      type: Number,
      default: 0,
    },
    lastLogin: {
      type: Date,
      default: null,
    },
    loginHistory: [{
      ip: String,
      device: String,
      userAgent: String,
      timestamp: { type: Date, default: Date.now },
    }],
  },
  { timestamps: true }
);

userSchema.pre('save', async function () {
  if (!this.isModified('passwordHash')) return;
  this.passwordHash = await bcrypt.hash(this.passwordHash, 12);
});

userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.passwordHash);
};

userSchema.methods.toJSON = function () {
  const obj = this.toObject();
  delete obj.passwordHash;
  delete obj.refreshToken;
  delete obj.__v;
  return obj;
};

const User = mongoose.models.User || mongoose.model('User', userSchema);
export default User;
