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

const baseSchemaOptions = {
  timestamps: true,
  versionKey: false,
  toJSON: toJsonOptions,
  toObject: toJsonOptions,
};

const requiredString = (maxlength = 160) => ({
  type: String,
  required: true,
  trim: true,
  maxlength,
});

const optionalString = (maxlength = 240) => ({
  type: String,
  trim: true,
  maxlength,
  default: '',
});

const factoryIdField = {
  factoryId: {
    type: Schema.Types.ObjectId,
    ref: 'Factory',
    required: true,
    index: true,
  },
};

const customerSchema = new Schema(
  {
    ...factoryIdField,
    company: requiredString(160),
    contact: optionalString(120),
    phone: optionalString(40),
    email: { ...optionalString(160), lowercase: true },
    address: optionalString(500),
    state: optionalString(80),
    district: optionalString(80),
    pincode: optionalString(20),
    gstin: optionalString(30),
  },
  baseSchemaOptions
);

customerSchema.index({ factoryId: 1, company: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });
customerSchema.index({ factoryId: 1, email: 1 }, { sparse: true });

const vendorSchema = new Schema(
  {
    ...factoryIdField,
    name: requiredString(160),
    contact: optionalString(40),
    alternativeContact: optionalString(40),
    email: { ...optionalString(160), lowercase: true },
    gst: optionalString(30),
    address: optionalString(500),
    materials: optionalString(300),
  },
  baseSchemaOptions
);

vendorSchema.index({ factoryId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const staffSchema = new Schema(
  {
    ...factoryIdField,
    name: requiredString(120),
    email: { ...optionalString(160), lowercase: true },
    phone: optionalString(40),
    role: requiredString(80),
    accessLevel: requiredString(80),
    active: { type: Boolean, default: true },
  },
  baseSchemaOptions
);

staffSchema.index({ factoryId: 1, email: 1 }, { sparse: true });
staffSchema.index({ factoryId: 1, name: 1 });

const serviceSchema = new Schema(
  {
    ...factoryIdField,
    name: requiredString(120),
    price: { type: Number, min: 0, default: 0 },
    unit: { type: String, trim: true, default: 'sheet' },
  },
  baseSchemaOptions
);

serviceSchema.index({ factoryId: 1, name: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const stockItemSchema = new Schema(
  {
    ...factoryIdField,
    material: requiredString(160),
    type: requiredString(80),
    quantity: { type: Number, min: 0, default: 0 },
    unit: { type: String, trim: true, default: 'sheets' },
    lowStockAt: { type: Number, min: 0, default: 10 },
  },
  baseSchemaOptions
);

stockItemSchema.index({ factoryId: 1, material: 1, type: 1 }, { unique: true, collation: { locale: 'en', strength: 2 } });

const wasteMaterialSchema = new Schema(
  {
    ...factoryIdField,
    code: requiredString(40),
    material: requiredString(120),
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    projectName: optionalString(180),
    size: optionalString(120),
    note: optionalString(300),
  },
  baseSchemaOptions
);

wasteMaterialSchema.index({ factoryId: 1, code: 1 }, { unique: true });

const projectMaterialSchema = new Schema(
  {
    source: { type: String, enum: ['inventory', 'new-stock'], default: 'new-stock' },
    stockItemId: { type: Schema.Types.ObjectId, ref: 'StockItem', default: null },
    materialName: requiredString(160),
    materialType: requiredString(80),
    thickness: optionalString(80),
    quantity: { type: Number, min: 0, default: 0 },
    unit: { type: String, trim: true, default: 'sheets' },
  },
  { _id: true, id: true, toJSON: toJsonOptions, toObject: toJsonOptions }
);

const projectServiceSchema = new Schema(
  {
    serviceId: { type: Schema.Types.ObjectId, ref: 'Service', default: null },
    serviceName: requiredString(120),
    unit: optionalString(40),
  },
  { _id: true, id: true, toJSON: toJsonOptions, toObject: toJsonOptions }
);

const projectWorkflowStageSchema = new Schema(
  {
    name: requiredString(120),
    completed: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },
    sortOrder: { type: Number, min: 0, default: 0 },
    materials: [
      {
        projectMaterialId: { type: Schema.Types.ObjectId, default: null },
        stockItemId: { type: Schema.Types.ObjectId, ref: 'StockItem', default: null },
        materialName: requiredString(160),
        materialType: requiredString(80),
        requiredQuantity: { type: Number, min: 0, default: 0 },
        completedQuantity: { type: Number, min: 0, default: 0 },
        unit: { type: String, trim: true, default: 'sheets' },
      },
    ],
  },
  { _id: true, id: true, toJSON: toJsonOptions, toObject: toJsonOptions }
);

const projectSchema = new Schema(
  {
    ...factoryIdField,
    code: { type: String, required: true, trim: true, uppercase: true, index: true },
    name: requiredString(180),
    customerId: { type: Schema.Types.ObjectId, ref: 'Customer', default: null },
    customerName: requiredString(160),
    workType: { type: String, enum: ['own', 'job'], default: 'own' },
    status: { type: String, enum: ['ongoing', 'completed', 'hold'], default: 'ongoing' },
    progress: { type: Number, min: 0, max: 100, default: 5 },
    delivery: { type: Date, default: null },
    amount: { type: Number, min: 0, default: 0 },
    notes: optionalString(1000),
    materials: [projectMaterialSchema],
    services: [projectServiceSchema],
    workflowStages: [projectWorkflowStageSchema],
  },
  baseSchemaOptions
);

projectSchema.index({ factoryId: 1, code: 1 }, { unique: true });
projectSchema.index({ factoryId: 1, customerName: 1 });
projectSchema.index({ factoryId: 1, status: 1, createdAt: -1 });

const materialUsageLogSchema = new Schema(
  {
    ...factoryIdField,
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', required: true, index: true },
    projectCode: requiredString(40),
    projectName: requiredString(180),
    stageName: requiredString(120),
    role: optionalString(120),
    staffName: optionalString(120),
    projectMaterialId: { type: Schema.Types.ObjectId, default: null },
    stockItemId: { type: Schema.Types.ObjectId, ref: 'StockItem', default: null },
    materialName: requiredString(160),
    materialType: requiredString(80),
    quantityUsed: { type: Number, min: 0, required: true },
    unit: { type: String, trim: true, default: 'sheets' },
    note: optionalString(300),
  },
  baseSchemaOptions
);

materialUsageLogSchema.index({ factoryId: 1, projectId: 1, stageName: 1, createdAt: -1 });

const transactionSchema = new Schema(
  {
    ...factoryIdField,
    transactionDate: { type: Date, default: Date.now },
    description: requiredString(240),
    type: { type: String, enum: ['credit', 'debit'], required: true },
    amount: { type: Number, min: 0, required: true },
  },
  baseSchemaOptions
);

transactionSchema.index({ factoryId: 1, transactionDate: -1 });

const invoiceItemSchema = new Schema(
  {
    name: requiredString(180),
    quantity: { type: Number, min: 0, default: 1 },
    price: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },
  },
  { _id: true, id: true, toJSON: toJsonOptions, toObject: toJsonOptions }
);

const invoiceSchema = new Schema(
  {
    ...factoryIdField,
    invoiceNo: { type: String, required: true, trim: true, uppercase: true },
    projectId: { type: Schema.Types.ObjectId, ref: 'Project', default: null },
    customerName: requiredString(160),
    invoiceDate: { type: Date, default: Date.now },
    status: { type: String, enum: ['draft', 'sent', 'paid', 'cancelled'], default: 'draft' },
    billToAddress: optionalString(500),
    design: { type: String, trim: true, default: 'standard' },
    logoDataUrl: optionalString(2000),
    subtotal: { type: Number, min: 0, default: 0 },
    taxAmount: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },
    items: [invoiceItemSchema],
  },
  baseSchemaOptions
);

const appSettingSchema = new Schema(
  {
    ...factoryIdField,
    scope: { type: String, required: true, trim: true },
    config: { type: Schema.Types.Mixed, default: {} },
  },
  baseSchemaOptions
);

const notificationSettingSchema = new Schema(
  {
    ...factoryIdField,
    audience: { type: String, required: true, trim: true },
    label: { type: String, required: true, trim: true },
    enabled: { type: Boolean, default: true },
  },
  baseSchemaOptions
);

invoiceSchema.index({ factoryId: 1, invoiceNo: 1 }, { unique: true });
appSettingSchema.index({ factoryId: 1, scope: 1 }, { unique: true });
notificationSettingSchema.index({ factoryId: 1, audience: 1, label: 1 }, { unique: true });

export const Customer = mongoose.model('Customer', customerSchema);
export const Vendor = mongoose.model('Vendor', vendorSchema);
export const Staff = mongoose.model('Staff', staffSchema);
export const Service = mongoose.model('Service', serviceSchema);
export const StockItem = mongoose.model('StockItem', stockItemSchema);
export const WasteMaterial = mongoose.model('WasteMaterial', wasteMaterialSchema);
export const Project = mongoose.model('Project', projectSchema);
export const MaterialUsageLog = mongoose.model('MaterialUsageLog', materialUsageLogSchema);
export const Transaction = mongoose.model('Transaction', transactionSchema);
export const Invoice = mongoose.model('Invoice', invoiceSchema);
export const AppSetting = mongoose.model('AppSetting', appSettingSchema);
export const NotificationSetting = mongoose.model('NotificationSetting', notificationSettingSchema);
