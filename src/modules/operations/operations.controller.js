import { StatusCodes } from 'http-status-codes';

import catchAsync from '../../utils/catchAsync.js';
import * as operationsService from './operations.service.js';

const ok = (res, data, status = StatusCodes.OK) =>
  res.status(status).json({
    success: true,
    count: Array.isArray(data) ? data.length : undefined,
    data,
  });

export const listResource = catchAsync(async (req, res) => {
  const records = await operationsService.listResource(req.params.resource, req.query, req.scope);
  ok(res, records);
});

export const getResource = catchAsync(async (req, res) => {
  const record = await operationsService.getResource(req.params.resource, req.params.id, req.scope);
  ok(res, record);
});

export const createResource = catchAsync(async (req, res) => {
  const record =
    req.params.resource === 'projects'
      ? await operationsService.createProject(req.body, req.scope)
      : await operationsService.createResource(req.params.resource, req.body, req.scope);

  ok(res, record, StatusCodes.CREATED);
});

export const updateResource = catchAsync(async (req, res) => {
  const record = await operationsService.updateResource(req.params.resource, req.params.id, req.body, req.scope);
  ok(res, record);
});

export const deleteResource = catchAsync(async (req, res) => {
  await operationsService.deleteResource(req.params.resource, req.params.id, req.scope);
  res.status(StatusCodes.OK).json({
    success: true,
    message: `${req.params.resource} record deleted successfully`,
  });
});

export const createProject = catchAsync(async (req, res) => {
  const project = await operationsService.createProject(req.body, req.scope);
  ok(res, project, StatusCodes.CREATED);
});

export const updateProjectWorkflow = catchAsync(async (req, res) => {
  const project = await operationsService.updateProjectWorkflow(req.params.id, req.body.stages, req.scope);
  ok(res, project);
});

export const allocateProjectStage = catchAsync(async (req, res) => {
  const project = await operationsService.allocateProjectStage(
    req.params.id,
    req.params.stageName,
    req.body.materials,
    req.scope
  );
  ok(res, project);
});

export const recordProjectStageUsage = catchAsync(async (req, res) => {
  const project = await operationsService.recordProjectStageUsage(
    req.params.id,
    req.params.stageName,
    req.body,
    req.scope
  );
  ok(res, project);
});

export const updateStockQuantity = catchAsync(async (req, res) => {
  const stock = await operationsService.updateStockQuantity(req.params.id, req.body.quantity, req.scope);
  ok(res, stock);
});

export const nextWasteCode = catchAsync(async (req, res) => {
  const code = await operationsService.makeWasteCode(req.scope);
  ok(res, { code });
});

export const upsertSetting = catchAsync(async (req, res) => {
  const setting = await operationsService.upsertSetting(req.params.scope, req.body.config, req.scope);
  ok(res, setting);
});

export const upsertNotification = catchAsync(async (req, res) => {
  const setting = await operationsService.upsertNotification(req.body, req.scope);
  ok(res, setting);
});

export const dashboardSummary = catchAsync(async (req, res) => {
  const summary = await operationsService.dashboardSummary(req.scope);
  ok(res, summary);
});

export const seedDefaults = catchAsync(async (req, res) => {
  const summary = await operationsService.seedDefaults(req.scope);
  ok(res, summary, StatusCodes.CREATED);
});
