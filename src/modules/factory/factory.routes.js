import express from 'express';

import * as factoryController from './factory.controller.js';
import validate from '../../middlewares/validate.js';
import {
  createFactorySchema,
  updateFactorySchema,
  idParamSchema,
} from './factory.validation.js';

const router = express.Router();

router
  .route('/')
  .post(validate(createFactorySchema), factoryController.createFactory)
  .get(factoryController.getFactories);

router
  .route('/:id')
  .get(validate(idParamSchema), factoryController.getFactoryById)
  .patch(validate(updateFactorySchema), factoryController.updateFactory)
  .delete(validate(idParamSchema), factoryController.deleteFactory);

export default router;
