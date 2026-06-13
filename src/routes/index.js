import express from 'express';

import { env } from '../config/env.js';
import healthRoutes from '../modules/health/health.routes.js';
import adminRoutes from '../modules/admin/admin.routes.js';
import factoryRoutes from '../modules/factory/factory.routes.js';
import settingsRoutes from '../modules/settings/settings.routes.js';
import operationsRoutes from '../modules/operations/operations.routes.js';
import authRoutes from '../modules/auth/auth.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);
router.use(`/${env.API_VERSION}/admin`, adminRoutes);
router.use(`/${env.API_VERSION}/factories`, factoryRoutes);
router.use(`/${env.API_VERSION}/settings`, settingsRoutes);
router.use('/admin', adminRoutes);
router.use('/factories', factoryRoutes);
router.use('/settings', settingsRoutes);
router.use(`/${env.API_VERSION}`, operationsRoutes);

export default router;
