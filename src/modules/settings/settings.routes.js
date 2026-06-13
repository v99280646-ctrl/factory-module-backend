import express from 'express';
import { requireAuth, requireFactoryRole } from '../../middlewares/auth.js';
import validate from '../../middlewares/validate.js';
import * as settingsController from './settings.controller.js';
import { saveAdminProfileSchema, updateFactorySettingsSchema } from './settings.validation.js';

const router = express.Router();

router.use(requireAuth, requireFactoryRole());

router.get('/:factoryId', settingsController.getFactorySettings);
router.post('/:factoryId/admin-profile', validate(saveAdminProfileSchema), settingsController.saveAdminProfile);
router.post('/:factoryId', validate(updateFactorySettingsSchema), settingsController.createFactorySettings);
router.put('/:factoryId', validate(updateFactorySettingsSchema), settingsController.updateFactorySettings);

export default router;
