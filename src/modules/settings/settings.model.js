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

const profileBlock = {
  fullName: { type: String, trim: true, maxlength: 160, default: '' },
  role: { type: String, trim: true, maxlength: 120, default: '' },
  phone: { type: String, trim: true, maxlength: 20, default: '' },
  email: { type: String, trim: true, lowercase: true, maxlength: 160, default: '' },
  city: { type: String, trim: true, maxlength: 120, default: '' },
  state: { type: String, trim: true, maxlength: 120, default: '' },
  pincode: { type: String, trim: true, maxlength: 12, default: '' },
  address: { type: String, trim: true, maxlength: 500, default: '' },
  logoUrl: { type: String, trim: true, maxlength: 500, default: '' },
};

const companyBlock = {
  companyName: { type: String, trim: true, maxlength: 160, default: '' },
  gstin: { type: String, trim: true, maxlength: 30, default: '' },
  phone: { type: String, trim: true, maxlength: 20, default: '' },
  email: { type: String, trim: true, lowercase: true, maxlength: 160, default: '' },
  city: { type: String, trim: true, maxlength: 120, default: '' },
  state: { type: String, trim: true, maxlength: 120, default: '' },
  pincode: { type: String, trim: true, maxlength: 12, default: '' },
  address: { type: String, trim: true, maxlength: 500, default: '' },
  logoUrl: { type: String, trim: true, maxlength: 500, default: '' },
};

const settingsSchema = new Schema(
  {
    factoryId: {
      type: Schema.Types.ObjectId,
      ref: 'Factory',
      required: true,
      unique: true,
    },
    adminProfile: {
      ...profileBlock,
    },
    companyProfile: {
      ...companyBlock,
    },
    integrations: {
      whatsapp: { type: Boolean, default: false },
      email: { type: Boolean, default: false },
      platforms: { type: Boolean, default: false },
    },
  },
  baseOptions
);

const FactorySettings = mongoose.model('FactorySettings', settingsSchema);

export default FactorySettings;
