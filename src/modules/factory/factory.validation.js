import { z } from 'zod';

const createFactorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    code: z.string().trim().min(1).max(40),
    location: z.string().trim().max(200).optional(),
    gstin: z.string().trim().max(20).optional(),
    phone: z.string().trim().max(20).optional(),
    email: z.string().trim().email().max(160).optional(),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    pincode: z.string().trim().max(12).optional(),
    address: z.string().trim().max(500).optional(),
    adminEmail: z.string().trim().email().max(160).optional(),
    status: z.enum(['active', 'disabled']).optional(),
    subscriptionStatus: z.enum(['trial', 'active', 'past_due', 'cancelled']).optional(),
    subscriptionPlan: z.string().trim().max(80).optional(),
    isActive: z.boolean().optional(),
  }),
});

const updateFactorySchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid factory id'),
  }),
  body: createFactorySchema.shape.body.partial().refine((body) => Object.keys(body).length > 0, {
    message: 'At least one field is required',
  }),
});

const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid factory id'),
  }),
});

export {
  createFactorySchema,
  updateFactorySchema,
  idParamSchema,
};
