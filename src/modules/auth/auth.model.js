import mongoose from 'mongoose';

const { Schema } = mongoose;

const toJsonOptions = {
  virtuals: true,
  versionKey: false,
  transform: (_doc, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
};

const baseOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: toJsonOptions,
  toObject: toJsonOptions,
};

const profileSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 20,
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
    avatarUrl: {
      type: String,
      trim: true,
      maxlength: 500,
      default: '',
    },
    googleSubject: {
      type: String,
      trim: true,
      index: true,
      default: '',
    },
    globalRole: {
      type: String,
      enum: ['super_admin', 'factory_user'],
      default: 'factory_user',
      index: true,
    },
    active: {
      type: Boolean,
      default: true,
    },
    lastLoginAt: {
      type: Date,
      default: null,
    },
  },
  baseOptions
);

const superAdminAccessSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      unique: true,
      index: true,
    },
    fullName: {
      type: String,
      trim: true,
      maxlength: 160,
      default: '',
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  baseOptions
);

const factoryMemberSchema = new Schema(
  {
    factoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Factory',
      required: true,
      index: true,
    },
    profileId: {
      type: Schema.Types.ObjectId,
      ref: 'Profile',
      required: false,
      index: true,
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      index: true,
    },
    role: {
      type: String,
      enum: ['factory_admin', 'employee'],
      required: true,
      index: true,
    },
    employeeRole: {
      type: String,
      trim: true,
      maxlength: 120,
      default: '',
    },
    status: {
      type: String,
      enum: ['active', 'disabled', 'invited'],
      default: 'active',
      index: true,
    },
  },
  baseOptions
);

factoryMemberSchema.index(
  { factoryId: 1, profileId: 1 },
  { unique: true, partialFilterExpression: { profileId: { $exists: true, $ne: null } } }
);
factoryMemberSchema.index({ factoryId: 1, email: 1 }, { unique: true });

const subscriptionSchema = new Schema(
  {
    factoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Factory',
      required: true,
      index: true,
    },
    provider: {
      type: String,
      trim: true,
      default: 'manual',
    },
    plan: {
      type: String,
      trim: true,
      default: 'trial',
    },
    status: {
      type: String,
      enum: ['trial', 'active', 'past_due', 'cancelled'],
      default: 'trial',
      index: true,
    },
    currentPeriodStart: {
      type: Date,
      default: null,
    },
    currentPeriodEnd: {
      type: Date,
      default: null,
    },
  },
  baseOptions
);

const paymentSchema = new Schema(
  {
    factoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Factory',
      required: true,
      index: true,
    },
    amount: {
      type: Number,
      min: 0,
      required: true,
    },
    currency: {
      type: String,
      trim: true,
      uppercase: true,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    provider: {
      type: String,
      trim: true,
      default: 'manual',
    },
    providerPaymentId: {
      type: String,
      trim: true,
      default: '',
    },
    paidAt: {
      type: Date,
      default: null,
    },
  },
  baseOptions
);

export const Profile = mongoose.model('Profile', profileSchema);
export const SuperAdminAccess = mongoose.model('SuperAdminAccess', superAdminAccessSchema);
export const FactoryMember = mongoose.model('FactoryMember', factoryMemberSchema);
export const Subscription = mongoose.model('Subscription', subscriptionSchema);
export const Payment = mongoose.model('Payment', paymentSchema);
