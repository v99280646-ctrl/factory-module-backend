import { StatusCodes } from 'http-status-codes';

import Factory from './factory.model.js';
import ApiError from '../../utils/ApiError.js';
import { FactoryMember, Profile, Subscription } from '../auth/auth.model.js';
import * as adminService from '../admin/admin.service.js';

export async function createFactory(payload) {
  try {
    const factory = await Factory.create({
      ...payload,
      email: payload.email?.trim().toLowerCase() || '',
      adminEmail: undefined,
    });
    await Subscription.create({
      factoryId: factory._id,
      plan: payload.subscriptionPlan || 'trial',
      status: payload.subscriptionStatus || 'trial',
    });

    if (payload.adminEmail) {
      const email = payload.adminEmail.trim().toLowerCase();
      const profile = await Profile.findOne({ email });
      await FactoryMember.findOneAndUpdate(
        { factoryId: factory._id, email },
        {
          factoryId: factory._id,
          profileId: profile?._id ?? undefined,
          email,
          role: 'factory_admin',
          employeeRole: '',
          status: profile ? 'active' : 'invited',
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }

    return factory;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Factory code already exists');
    }
    throw error;
  }
}

export async function getFactories() {
  return Factory.aggregate([
    {
      $lookup: {
        from: 'factorymembers',
        localField: '_id',
        foreignField: 'factoryId',
        as: 'members',
      },
    },
    {
      $lookup: {
        from: 'subscriptions',
        localField: '_id',
        foreignField: 'factoryId',
        as: 'subscriptions',
      },
    },
    {
      $addFields: {
        id: { $toString: '$_id' },
        adminEmail: {
          $first: {
            $map: {
              input: {
                $filter: {
                  input: '$members',
                  as: 'member',
                  cond: { $eq: ['$$member.role', 'factory_admin'] },
                },
              },
              as: 'admin',
              in: '$$admin.email',
            },
          },
        },
        subscription: { $first: '$subscriptions' },
        companyEmail: '$email',
      },
    },
    {
      $project: {
        _id: 0,
        members: 0,
        subscriptions: 0,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);
}

export async function getFactoryById(id) {
  return adminService.getFactoryDetails(id);
}

export async function updateFactory(id, payload) {
  try {
    const factory = await Factory.findByIdAndUpdate(id, payload, {
      new: true,
      runValidators: true,
    });

    if (!factory) {
      throw new ApiError(StatusCodes.NOT_FOUND, 'Factory not found');
    }

    return factory;
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Factory code already exists');
    }
    throw error;
  }
}

export async function deleteFactory(id) {
  const factory = await Factory.findByIdAndDelete(id);

  if (!factory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Factory not found');
  }

  return factory;
}
