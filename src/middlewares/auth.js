import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import { env } from '../config/env.js';
import ApiError from '../utils/ApiError.js';
import { FactoryMember, Profile } from '../modules/auth/auth.model.js';

function readBearerToken(req) {
  const header = req.headers.authorization || '';
  if (!header.startsWith('Bearer ')) return '';
  return header.slice('Bearer '.length).trim();
}

export async function requireAuth(req, _res, next) {
  try {
    const token = readBearerToken(req);
    if (!token) throw new ApiError(StatusCodes.UNAUTHORIZED, 'Authentication required');

    const payload = jwt.verify(token, env.JWT_SECRET);
    const profile = await Profile.findById(payload.sub);
    if (!profile || !profile.active) {
      throw new ApiError(StatusCodes.UNAUTHORIZED, 'User account is disabled or not found');
    }

    req.auth = {
      profile,
      profileId: profile.id,
      email: profile.email,
      globalRole: profile.globalRole,
    };
    next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    next(new ApiError(StatusCodes.UNAUTHORIZED, 'Invalid or expired session'));
  }
}

export function requireSuperAdmin(req, _res, next) {
  conslole.log('Checking super admin access for', req.auth?.email);
  if (req.auth?.globalRole !== 'super_admin') {
    next(new ApiError(StatusCodes.FORBIDDEN, 'Super admin access required'));
    return;
  }
  next();
}

export function requireFactoryRole(roles = []) {
  return async (req, _res, next) => {
    try {
      if (req.auth?.globalRole === 'super_admin') {
        const factoryId = req.headers['x-factory-id'] || req.query.factoryId;
        req.scope = { factoryId: factoryId || null, role: 'super_admin' };
        next();
        return;
      }

      const factoryId = req.headers['x-factory-id'] || req.query.factoryId;
      const filter = {
        profileId: req.auth.profile._id,
        status: 'active',
      };
      if (factoryId) filter.factoryId = factoryId;

      const membership = await FactoryMember.findOne(filter).sort({ role: 1 });
      if (!membership) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'No active factory access found');
      }
      if (roles.length && !roles.includes(membership.role)) {
        throw new ApiError(StatusCodes.FORBIDDEN, 'Insufficient factory permissions');
      }

      req.scope = {
        factoryId: membership.factoryId,
        membership,
        role: membership.role,
        employeeRole: membership.employeeRole,
      };
      next();
    } catch (error) {
      next(error);
    }
  };
}
