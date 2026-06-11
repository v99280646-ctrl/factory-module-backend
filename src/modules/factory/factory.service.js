import { StatusCodes } from 'http-status-codes';

import Factory from './factory.model.js';
import ApiError from '../../utils/ApiError.js';

export async function createFactory(payload) {
  try {
    return await Factory.create(payload);
  } catch (error) {
    if (error.code === 11000) {
      throw new ApiError(StatusCodes.CONFLICT, 'Factory code already exists');
    }
    throw error;
  }
}

export async function getFactories() {
  return Factory.find().sort({ createdAt: -1 });
}

export async function getFactoryById(id) {
  const factory = await Factory.findById(id);

  if (!factory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Factory not found');
  }

  return factory;
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
