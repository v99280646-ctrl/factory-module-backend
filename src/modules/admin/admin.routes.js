import express from 'express';

import { requireAuth, requireSuperAdmin } from '../../middlewares/auth.js';
import * as adminController from './admin.controller.js';
import validate from '../../middlewares/validate.js';
import { createAccountSchema } from './admin.validation.js';

const router = express.Router();

router.use(requireAuth, requireSuperAdmin);

router.get('/dashboard/summary', adminController.dashboardSummary);
router.get('/factories', adminController.getFactories);
router.get('/factories/:id', adminController.getFactoryDetails);
router.post('/accounts', validate(createAccountSchema), adminController.createAccount);

export default router;
