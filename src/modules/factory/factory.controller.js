import { StatusCodes } from 'http-status-codes';

import * as factoryService from './factory.service.js';
import catchAsync from '../../utils/catchAsync.js';

const createFactory = catchAsync(async (req, res) => {
  const factory = await factoryService.createFactory(req.body);

  res.status(StatusCodes.CREATED).json({
    success: true,
    data: factory,
  });
});

const getFactories = catchAsync(async (req, res) => {
  const factories = await factoryService.getFactories();

  res.status(StatusCodes.OK).json({
    success: true,
    count: factories.length,
    data: factories,
  });
});

const getFactoryById = catchAsync(async (req, res) => {
  const factory = await factoryService.getFactoryById(req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    data: factory,
  });
});

const updateFactory = catchAsync(async (req, res) => {
  const factory = await factoryService.updateFactory(req.params.id, req.body);

  res.status(StatusCodes.OK).json({
    success: true,
    data: factory,
  });
});

const deleteFactory = catchAsync(async (req, res) => {
  await factoryService.deleteFactory(req.params.id);

  res.status(StatusCodes.OK).json({
    success: true,
    message: 'Factory deleted successfully',
  });
});

export {
  createFactory,
  getFactories,
  getFactoryById,
  updateFactory,
  deleteFactory,
};
