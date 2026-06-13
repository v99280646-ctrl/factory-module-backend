import express from 'express';

import validate from '../../middlewares/validate.js';
import { requireAuth, requireFactoryRole } from '../../middlewares/auth.js';
import * as authController from './auth.controller.js';
import { googleLoginSchema, inviteMemberSchema } from './auth.validation.js';

const router = express.Router();

router.post('/google', validate(googleLoginSchema), authController.googleLogin);
router.get('/me', requireAuth, authController.me);
router.post(
  '/factories/:factoryId/members',
  requireAuth,
  requireFactoryRole(['factory_admin']),
  validate(inviteMemberSchema),
  authController.inviteMember
);

export default router;
