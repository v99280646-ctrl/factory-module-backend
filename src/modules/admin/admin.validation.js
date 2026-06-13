import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid id');

export const createAccountSchema = z.object({
  body: z.object({
    email: z.string().trim().email().max(160),
    fullName: z.string().trim().max(160).optional(),
    role: z.enum(['super_admin', 'factory_admin', 'employee']),
    factoryId: objectId.optional(),
    employeeRole: z.string().trim().max(120).optional(),
    phone: z.string().trim().max(20).optional(),
    city: z.string().trim().max(120).optional(),
    state: z.string().trim().max(120).optional(),
    pincode: z.string().trim().max(12).optional(),
  }),
});
