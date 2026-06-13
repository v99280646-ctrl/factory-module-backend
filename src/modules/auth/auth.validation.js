import { z } from 'zod';

const objectId = z.string().regex(/^[0-9a-fA-F]{24}$/, 'Invalid factory id');

export const googleLoginSchema = z.object({
  body: z.object({
    credential: z.string().min(20),
  }),
});

export const inviteMemberSchema = z.object({
  params: z.object({
    factoryId: objectId,
  }),
  body: z.object({
    email: z.string().trim().email().max(160),
    role: z.enum(['factory_admin', 'employee']),
    employeeRole: z.string().trim().max(120).optional(),
  }),
});
