import mongoose from 'mongoose';

const featureFlagSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    enabled: {
      type: Boolean,
      default: true,
    },
    description: {
      type: String,
      default: '',
    },
    category: {
      type: String,
      enum: ['ai', 'social', 'chat', 'tournaments', 'clips', 'ui', 'experimental'],
      default: 'experimental',
    },
  },
  { timestamps: true }
);

const FeatureFlag = mongoose.models.FeatureFlag || mongoose.model('FeatureFlag', featureFlagSchema);
export default FeatureFlag;
