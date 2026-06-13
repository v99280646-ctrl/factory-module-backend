import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import * as adminService from './admin.service.js';

const ok = (res, data, status = StatusCodes.OK) =>
  res.status(status).json({
    success: true,
    count: Array.isArray(data) ? data.length : undefined,
    data,
  });

export const dashboardSummary = catchAsync(async (_req, res) => {
  const summary = await adminService.dashboardSummary();
  ok(res, summary);
});

export const getFactories = catchAsync(async (_req, res) => {
  const factories = await adminService.listFactories();
  console.log(factories, "factories");
  ok(res, factories);
});

export const getFactoryDetails = catchAsync(async (req, res) => {
  const factory = await adminService.getFactoryDetails(req.params.id);
  ok(res, factory);
});

export const createAccount = catchAsync(async (req, res) => {
  const account = await adminService.createAccount(req.body);
  ok(res, account, StatusCodes.CREATED);
});
