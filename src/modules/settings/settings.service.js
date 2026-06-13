import { StatusCodes } from 'http-status-codes';
import ApiError from '../../utils/ApiError.js';
import { Profile } from '../auth/auth.model.js';
import Factory from '../factory/factory.model.js';
import FactorySettings from './settings.model.js';

async function ensureFactory(factoryId) {
  const factory = await Factory.findById(factoryId);
  if (!factory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Factory not found');
  }
  return factory;
}

function buildDefaultSettings(factory, profile) {
  return {
    factoryId: factory._id,
    adminProfile: {
      fullName: profile?.fullName || '',
      role: 'Administrator',
      phone: profile?.phone || '',
      email: profile?.email || '',
      city: profile?.city || '',
      state: profile?.state || '',
      pincode: profile?.pincode || '',
      address: '',
      logoUrl: '',
    },
    companyProfile: {
      companyName: factory.name || '',
      gstin: factory.gstin || '',
      phone: factory.phone || '',
      email: factory.email || '',
      city: factory.city || '',
      state: factory.state || '',
      pincode: factory.pincode || '',
      address: factory.address || factory.location || '',
      logoUrl: '',
    },
    integrations: {
      whatsapp: false,
      email: false,
      platforms: false,
    },
  };
}

function isMeaningfulValue(value) {
  if (typeof value === 'boolean') {
    return true;
  }

  if (value === null || value === undefined) {
    return false;
  }

  return String(value).trim() !== '';
}

function mergeWithFallback(fallback, source) {
  return Object.fromEntries(
    Object.entries(fallback).map(([key, fallbackValue]) => {
      const sourceValue = source?.[key];
      return [key, isMeaningfulValue(sourceValue) ? sourceValue : fallbackValue];
    })
  );
}

export async function getFactorySettings(factoryId, profile) {
  const factory = await ensureFactory(factoryId);
  const settings = await FactorySettings.findOne({ factoryId });
  const defaults = buildDefaultSettings(factory, profile);
  const adminProfile = settings?.adminProfile?.toObject?.() || settings?.adminProfile || {};
  const companyProfile = settings?.companyProfile?.toObject?.() || settings?.companyProfile || {};
  const integrations = settings?.integrations?.toObject?.() || settings?.integrations || {};

  if (!settings) {
    return defaults;
  }

  return {
    ...defaults,
    adminProfile: mergeWithFallback(defaults.adminProfile, adminProfile),
    companyProfile: mergeWithFallback(defaults.companyProfile, companyProfile),
    integrations: mergeWithFallback(defaults.integrations, integrations),
    id: settings.id,
    createdAt: settings.createdAt,
    updatedAt: settings.updatedAt,
  };
}

export async function upsertFactorySettings(factoryId, payload, profile) {
  const factory = await ensureFactory(factoryId);

  const normalizedAdmin = payload.adminProfile || {};
  const normalizedCompany = payload.companyProfile || {};
  const normalizedIntegrations = payload.integrations || {};

  const settingsUpdate = {};

  if (payload.adminProfile) {
    Object.entries(normalizedAdmin).forEach(([key, value]) => {
      settingsUpdate[`adminProfile.${key}`] = value;
    });
  }

  if (payload.companyProfile) {
    Object.entries(normalizedCompany).forEach(([key, value]) => {
      settingsUpdate[`companyProfile.${key}`] = value;
    });
  }

  if (payload.integrations) {
    Object.entries(normalizedIntegrations).forEach(([key, value]) => {
      settingsUpdate[`integrations.${key}`] = value;
    });
  }

  if (payload.adminProfile) {
    await Profile.findByIdAndUpdate(
      profile._id,
      {
        $set: {
          fullName: normalizedAdmin.fullName ?? profile.fullName ?? '',
          phone: normalizedAdmin.phone ?? profile.phone ?? '',
          email: normalizedAdmin.email ? normalizedAdmin.email.toLowerCase() : profile.email,
          city: normalizedAdmin.city ?? profile.city ?? '',
          state: normalizedAdmin.state ?? profile.state ?? '',
          pincode: normalizedAdmin.pincode ?? profile.pincode ?? '',
          address: normalizedAdmin.address ?? profile.address ?? '',
        },
      },
      { runValidators: true }
    );
  }

  if (payload.companyProfile) {
    await Factory.findByIdAndUpdate(
      factoryId,
      {
        $set: {
          name: normalizedCompany.companyName ?? factory.name,
          gstin: normalizedCompany.gstin ?? factory.gstin ?? '',
          phone: normalizedCompany.phone ?? factory.phone ?? '',
          email: normalizedCompany.email ? normalizedCompany.email.toLowerCase() : factory.email ?? '',
          city: normalizedCompany.city ?? factory.city ?? '',
          state: normalizedCompany.state ?? factory.state ?? '',
          pincode: normalizedCompany.pincode ?? factory.pincode ?? '',
          address: normalizedCompany.address ?? factory.address ?? factory.location ?? '',
        },
      },
      { runValidators: true }
    );
  }

  const settings = await FactorySettings.findOneAndUpdate(
    { factoryId },
    { $set: settingsUpdate, $setOnInsert: { factoryId } },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return settings;
}

export async function saveAdminProfile(factoryId, adminProfile, profile) {
  await ensureFactory(factoryId);

  const normalizedAdmin = adminProfile || {};

  await Profile.findByIdAndUpdate(
    profile._id,
    {
      $set: {
        fullName: normalizedAdmin.fullName ?? profile.fullName ?? '',
        phone: normalizedAdmin.phone ?? profile.phone ?? '',
        email: normalizedAdmin.email ? normalizedAdmin.email.toLowerCase() : profile.email,
        city: normalizedAdmin.city ?? profile.city ?? '',
        state: normalizedAdmin.state ?? profile.state ?? '',
        pincode: normalizedAdmin.pincode ?? profile.pincode ?? '',
        address: normalizedAdmin.address ?? profile.address ?? '',
      },
    },
    { runValidators: true }
  );

  const settings = await FactorySettings.findOneAndUpdate(
    { factoryId },
    {
      $set: Object.fromEntries(
        Object.entries(normalizedAdmin).map(([key, value]) => [`adminProfile.${key}`, value])
      ),
      $setOnInsert: { factoryId },
    },
    { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return settings;
}
