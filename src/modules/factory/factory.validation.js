import { z } from 'zod';

const createFactorySchema = z.object({
  body: z.object({
    name: z.string().trim().min(1).max(120),
    code: z.string().trim().min(1).max(40),
    location: z.string().trim().max(200).optional(),
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
