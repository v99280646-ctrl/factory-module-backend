import express from 'express';

import * as adminController from '../admin/admin.controller.js';
import * as operationsController from './operations.controller.js';
import validate from '../../middlewares/validate.js';
import { requireAuth, requireFactoryRole, requireSuperAdmin } from '../../middlewares/auth.js';
import {
  bodyForResource,
  createProjectSchema,
  resourceIdParamSchema,
  resourceParamSchema,
  stageAllocationSchema,
  stageUsageSchema,
  updateStockQuantitySchema,
  updateWorkflowSchema,
  upsertNotificationSchema,
  upsertSettingSchema,
} from './operations.validation.js';

const router = express.Router();

router.use(requireAuth, requireFactoryRole());

router.get('/admin/dashboard/summary', requireSuperAdmin, adminController.dashboardSummary);
router.get('/admin/factories', requireSuperAdmin, adminController.getFactories);
router.get('/admin/factories/:id', requireSuperAdmin, adminController.getFactoryDetails);

router.get('/dashboard/summary', operationsController.dashboardSummary);
router.post('/bootstrap/defaults', operationsController.seedDefaults);

router.post('/projects', validate(createProjectSchema), operationsController.createProject);
router.patch('/projects/:id/workflow', validate(updateWorkflowSchema), operationsController.updateProjectWorkflow);
router.post('/projects/:id/stages/:stageName/allocation', validate(stageAllocationSchema), operationsController.allocateProjectStage);
router.post('/projects/:id/stages/:stageName/usage', validate(stageUsageSchema), operationsController.recordProjectStageUsage);

router.patch('/stock/:id/quantity', validate(updateStockQuantitySchema), operationsController.updateStockQuantity);
router.get('/waste/next-code', operationsController.nextWasteCode);

router.put('/settings/:scope', validate(upsertSettingSchema), operationsController.upsertSetting);
router.put('/notifications', validate(upsertNotificationSchema), operationsController.upsertNotification);

router
  .route('/:resource')
  .get(validate(resourceParamSchema), operationsController.listResource)
  .post(validate(resourceParamSchema), bodyForResource(), operationsController.createResource);

router
  .route('/:resource/:id')
  .get(validate(resourceIdParamSchema), operationsController.getResource)
  .patch(validate(resourceIdParamSchema), bodyForResource({ partial: true }), operationsController.updateResource)
  .delete(validate(resourceIdParamSchema), operationsController.deleteResource);

export default router;
