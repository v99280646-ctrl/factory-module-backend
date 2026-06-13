import { StatusCodes } from 'http-status-codes';

import catchAsync from '../../utils/catchAsync.js';
import ApiError from '../../utils/ApiError.js';
import * as authService from './auth.service.js';

export const googleLogin = catchAsync(async (req, res) => {
  const session = await authService.loginWithGoogle(req.body.credential);
  res.status(StatusCodes.OK).json({ success: true, data: session });
});

export const me = catchAsync(async (req, res) => {
  const data = await authService.currentUser(req.auth.profile);
  res.status(StatusCodes.OK).json({ success: true, data });
});

export const inviteMember = catchAsync(async (req, res) => {
  if (req.auth.globalRole !== 'super_admin' && String(req.scope.factoryId) !== String(req.params.factoryId)) {
    throw new ApiError(StatusCodes.FORBIDDEN, 'Cannot manage another factory');
  }
  const member = await authService.inviteFactoryMember(req.params.factoryId, req.body);
  res.status(StatusCodes.CREATED).json({ success: true, data: member });
});
