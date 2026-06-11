import express from 'express';

import { env } from '../config/env.js';
import healthRoutes from '../modules/health/health.routes.js';
import factoryRoutes from '../modules/factory/factory.routes.js';

const router = express.Router();

router.use('/health', healthRoutes);
router.use(`/${env.API_VERSION}/factories`, factoryRoutes);

export default router;
