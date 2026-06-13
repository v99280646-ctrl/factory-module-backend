import mongoose from 'mongoose';

const toJsonOptions = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
};

const factorySchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    code: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      unique: true,
      index: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: 200,
    },
    gstin: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
      default: '',
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      maxlength: 160,
      default: '',
    },
    city: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    state: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    pincode: {
      type: String,
      trim: true,
      maxlength: 12,
      default: '',
    },
    address: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'disabled'],
      default: 'active',
      index: true,
    },
    subscriptionStatus: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'cancelled'],
      default: 'trial',
      index: true,
    },
    subscriptionPlan: {
      type: String,
      trim: true,
      default: 'trial',
    },
    isActive: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
    toJSON: toJsonOptions,
    toObject: toJsonOptions,
  }
);

const Factory = mongoose.model('Factory', factorySchema);

export default Factory;
