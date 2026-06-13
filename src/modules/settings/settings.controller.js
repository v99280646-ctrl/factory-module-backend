import { StatusCodes } from 'http-status-codes';
import catchAsync from '../../utils/catchAsync.js';
import * as settingsService from './settings.service.js';

export const getFactorySettings = catchAsync(async (req, res) => {
  const data = await settingsService.getFactorySettings(req.params.factoryId, req.auth.profile);
  res.status(StatusCodes.OK).json({ success: true, data });
});

export const updateFactorySettings = catchAsync(async (req, res) => {
  const data = await settingsService.upsertFactorySettings(req.params.factoryId, req.body, req.auth.profile);
  res.status(StatusCodes.OK).json({ success: true, data });
});

export const createFactorySettings = catchAsync(async (req, res) => {
  const data = await settingsService.upsertFactorySettings(req.params.factoryId, req.body, req.auth.profile);
  res.status(StatusCodes.CREATED).json({ success: true, data });
});

export const saveAdminProfile = catchAsync(async (req, res) => {
  const data = await settingsService.saveAdminProfile(
    req.params.factoryId,
    req.body.adminProfile,
    req.auth.profile
  );
  res.status(StatusCodes.CREATED).json({ success: true, data });
});
