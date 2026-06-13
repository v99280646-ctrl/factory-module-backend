import { z } from 'zod';

const stringField = (max = 160) => z.string().trim().max(max).optional();

const profileSchema = z.object({
  fullName: stringField(160),
  role: stringField(120),
  phone: stringField(20),
  email: z.string().trim().email().max(160).optional(),
  city: stringField(120),
  state: stringField(120),
  pincode: stringField(12),
  address: stringField(500),
  logoUrl: stringField(500),
});

const companySchema = z.object({
  companyName: stringField(160),
  gstin: stringField(30),
  phone: stringField(20),
  email: z.string().trim().email().max(160).optional(),
  city: stringField(120),
  state: stringField(120),
  pincode: stringField(12),
  address: stringField(500),
  logoUrl: stringField(500),
});

export const saveAdminProfileSchema = z.object({
  params: z.object({
    factoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid factory id'),
  }),
  body: z.object({
    adminProfile: profileSchema.partial(),
  }),
});

export const updateFactorySettingsSchema = z.object({
  params: z.object({
    factoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid factory id'),
  }),
  body: z.object({
    adminProfile: profileSchema.partial().optional(),
    companyProfile: companySchema.partial().optional(),
    integrations: z
      .object({
        whatsapp: z.boolean().optional(),
        email: z.boolean().optional(),
        platforms: z.boolean().optional(),
      })
      .optional(),
  }).refine((body) => Object.keys(body).length > 0, {
    message: 'At least one section is required',
  }),
});

export const getFactorySettingsSchema = z.object({
  params: z.object({
    factoryId: z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid factory id'),
  }),
});
