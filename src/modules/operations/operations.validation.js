import { z } from 'zod';
import { StatusCodes } from 'http-status-codes';

import ApiError from '../../utils/ApiError.js';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');
const emptyToUndefined = (value) => (value === '' || value === null ? undefined : value);
const optionalString = (max = 500) => z.preprocess(emptyToUndefined, z.string().trim().max(max).optional());
const optionalNumber = z.preprocess(emptyToUndefined, z.coerce.number().min(0).optional());

const idParamSchema = z.object({
  params: z.object({ id: objectId }),
});

const resourceParamSchema = z.object({
  params: z.object({
    resource: z.enum([
      'customers',
      'vendors',
      'staff',
      'services',
      'stock',
      'waste',
      'projects',
      'usage-logs',
      'transactions',
      'invoices',
      'settings',
      'notifications',
    ]),
  }),
  query: z.object({}).passthrough().optional(),
});

const resourceIdParamSchema = z.object({
  params: resourceParamSchema.shape.params.extend({ id: objectId }),
});

const customerSchema = z.object({
  company: z.string().trim().min(1).max(160),
  contact: optionalString(120),
  phone: optionalString(40),
  email: optionalString(160),
  address: optionalString(500),
  state: optionalString(80),
  district: optionalString(80),
  pincode: optionalString(20),
  gstin: optionalString(30),
});

const vendorSchema = z.object({
  name: z.string().trim().min(1).max(160),
  contact: optionalString(40),
  alternativeContact: optionalString(40),
  email: optionalString(160),
  gst: optionalString(30),
  address: optionalString(500),
  materials: optionalString(300),
});

const staffSchema = z.object({
  name: z.string().trim().min(1).max(120),
  email: optionalString(160),
  phone: optionalString(40),
  role: z.string().trim().min(1).max(80),
  accessLevel: z.string().trim().min(1).max(80),
  active: z.boolean().optional(),
});

const serviceSchema = z.object({
  name: z.string().trim().min(1).max(120),
  price: optionalNumber.default(0),
  unit: z.string().trim().min(1).max(40).default('sheet'),
});

const stockSchema = z.object({
  material: z.string().trim().min(1).max(160),
  type: z.string().trim().min(1).max(80),
  quantity: optionalNumber.default(0),
  unit: z.string().trim().min(1).max(40).default('sheets'),
  lowStockAt: optionalNumber.default(10),
});

const wasteSchema = z.object({
  code: optionalString(40),
  material: z.string().trim().min(1).max(120),
  projectId: objectId.optional().nullable(),
  projectName: optionalString(180),
  size: optionalString(120),
  note: optionalString(300),
});

const materialSchema = z.object({
  _id: objectId.optional(),
  source: z.enum(['inventory', 'new-stock']).default('new-stock'),
  stockItemId: objectId.optional().nullable(),
  materialName: optionalString(160),
  materialType: z.string().trim().min(1).max(80),
  thickness: optionalString(80),
  quantity: z.coerce.number().min(0),
  unit: z.string().trim().min(1).max(40).default('sheets'),
});

const projectServiceSchema = z.object({
  _id: objectId.optional(),
  serviceId: objectId.optional().nullable(),
  serviceName: optionalString(120),
  unit: optionalString(40),
});

const workflowStageSchema = z.object({
  _id: objectId.optional(),
  name: z.string().trim().min(1).max(120),
  completed: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0).default(0),
  sortOrder: z.coerce.number().min(0).default(0),
  materials: z.array(z.object({
    _id: objectId.optional(),
    projectMaterialId: objectId.optional().nullable(),
    stockItemId: objectId.optional().nullable(),
    materialName: z.string().trim().min(1).max(160),
    materialType: z.string().trim().min(1).max(80),
    requiredQuantity: z.coerce.number().min(0).default(0),
    completedQuantity: z.coerce.number().min(0).default(0),
    unit: z.string().trim().min(1).max(40).default('sheets'),
  })).default([]),
});

const stageAllocationSchema = z.object({
  params: z.object({
    id: objectId,
    stageName: z.string().trim().min(1).max(120),
  }),
  body: z.object({
    materials: z.array(z.object({
      projectMaterialId: objectId,
      requiredQuantity: z.coerce.number().min(0),
    })).min(1),
  }),
});

const stageUsageSchema = z.object({
  params: z.object({
    id: objectId,
    stageName: z.string().trim().min(1).max(120),
  }),
  body: z.object({
    role: optionalString(120),
    staffName: optionalString(120),
    note: optionalString(300),
    materials: z.array(z.object({
      projectMaterialId: objectId,
      quantityUsed: z.coerce.number().min(0),
    })).min(1),
  }),
});

const projectSchema = z.object({
  code: optionalString(40),
  name: z.string().trim().min(1).max(180),
  customerId: objectId.optional().nullable(),
  customerName: optionalString(160),
  workType: z.enum(['own', 'job']).default('own'),
  status: z.enum(['ongoing', 'completed', 'hold']).default('ongoing'),
  progress: z.coerce.number().min(0).max(100).default(5),
  delivery: optionalString(40),
  amount: optionalNumber.default(0),
  notes: optionalString(1000),
  materials: z.array(materialSchema).min(1),
  services: z.array(projectServiceSchema).default([]),
});

const transactionSchema = z.object({
  transactionDate: optionalString(40),
  description: z.string().trim().min(1).max(240),
  type: z.enum(['credit', 'debit']),
  amount: z.coerce.number().min(0),
});

const usageLogSchema = z.object({
  projectId: objectId,
  projectCode: z.string().trim().min(1).max(40),
  projectName: z.string().trim().min(1).max(180),
  stageName: z.string().trim().min(1).max(120),
  role: optionalString(120),
  staffName: optionalString(120),
  projectMaterialId: objectId.optional().nullable(),
  stockItemId: objectId.optional().nullable(),
  materialName: z.string().trim().min(1).max(160),
  materialType: z.string().trim().min(1).max(80),
  quantityUsed: z.coerce.number().min(0),
  unit: z.string().trim().min(1).max(40).default('sheets'),
  note: optionalString(300),
});

const invoiceItemSchema = z.object({
  name: z.string().trim().min(1).max(180),
  quantity: z.coerce.number().min(0).default(1),
  price: z.coerce.number().min(0).default(0),
  tax: z.coerce.number().min(0).default(0),
  total: z.coerce.number().min(0).default(0),
});

const invoiceSchema = z.object({
  invoiceNo: z.string().trim().min(1).max(60),
  projectId: objectId.optional().nullable(),
  customerName: z.string().trim().min(1).max(160),
  invoiceDate: optionalString(40),
  status: z.enum(['draft', 'sent', 'paid', 'cancelled']).default('draft'),
  billToAddress: optionalString(500),
  design: optionalString(80),
  logoDataUrl: optionalString(2000),
  subtotal: optionalNumber.default(0),
  taxAmount: optionalNumber.default(0),
  total: optionalNumber.default(0),
  items: z.array(invoiceItemSchema).default([]),
});

const settingSchema = z.object({
  scope: z.string().trim().min(1).max(80),
  config: z.record(z.string(), z.unknown()).default({}),
});

const notificationSchema = z.object({
  audience: z.string().trim().min(1).max(80),
  label: z.string().trim().min(1).max(120),
  enabled: z.boolean(),
});

const schemasByResource = {
  customers: customerSchema,
  vendors: vendorSchema,
  staff: staffSchema,
  services: serviceSchema,
  stock: stockSchema,
  waste: wasteSchema,
  projects: projectSchema,
  'usage-logs': usageLogSchema,
  transactions: transactionSchema,
  invoices: invoiceSchema,
  settings: settingSchema,
  notifications: notificationSchema,
};

function bodyForResource({ partial = false } = {}) {
  return (req, _res, next) => {
    const schema = schemasByResource[req.params.resource];
    const result = (partial ? schema.partial() : schema).safeParse(req.body);
    if (!result.success) {
      const message = result.error.issues
        .map((issue) => `${issue.path.join('.')}: ${issue.message}`)
        .join(', ');
      next(new ApiError(StatusCodes.BAD_REQUEST, message));
      return;
    }
    req.body = result.data;
    next();
  };
}

const createProjectSchema = z.object({ body: projectSchema });
const updateWorkflowSchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ stages: z.array(workflowStageSchema).min(1) }),
});
const updateStockQuantitySchema = z.object({
  params: z.object({ id: objectId }),
  body: z.object({ quantity: z.coerce.number().min(0) }),
});
const upsertSettingSchema = z.object({
  params: z.object({ scope: z.string().trim().min(1).max(80) }),
  body: z.object({ config: z.record(z.string(), z.unknown()).default({}) }),
});
const upsertNotificationSchema = z.object({ body: notificationSchema });

export {
  bodyForResource,
  createProjectSchema,
  idParamSchema,
  resourceIdParamSchema,
  resourceParamSchema,
  stageAllocationSchema,
  stageUsageSchema,
  updateStockQuantitySchema,
  updateWorkflowSchema,
  upsertNotificationSchema,
  upsertSettingSchema,
};
