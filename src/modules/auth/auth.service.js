import { OAuth2Client } from 'google-auth-library';
import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

import { env } from '../../config/env.js';
import ApiError from '../../utils/ApiError.js';
import Factory from '../factory/factory.model.js';
import { FactoryMember, Profile, SuperAdminAccess } from './auth.model.js';

const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

async function isSuperAdminEmail(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const access = await SuperAdminAccess.findOne({ email: normalizedEmail, active: true });
  if (access) return true;
  return env.SUPER_ADMIN_EMAILS.split(',')
    .map((entry) => entry.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalizedEmail);
}

function signSession(profile) {
  return jwt.sign(
    {
      sub: profile.id,
      email: profile.email,
      globalRole: profile.globalRole,
    },
    env.JWT_SECRET,
    { expiresIn: env.JWT_EXPIRES_IN }
  );
}

async function verifyGoogleCredential(credential) {
  if (!env.GOOGLE_CLIENT_ID) {
    throw new ApiError(StatusCodes.INTERNAL_SERVER_ERROR, 'GOOGLE_CLIENT_ID is not configured');
  }

  const ticket = await googleClient.verifyIdToken({
    idToken: credential,
    audience: env.GOOGLE_CLIENT_ID,
  });
  const payload = ticket.getPayload();
  if (!payload?.email || !payload.email_verified) {
    throw new ApiError(StatusCodes.UNAUTHORIZED, 'Google email is not verified');
  }
  return {
    email: payload.email.toLowerCase(),
    fullName: payload.name || '',
    avatarUrl: payload.picture || '',
    googleSubject: payload.sub || '',
  };
}

export async function loginWithGoogle(credential) {
  const googleUser = await verifyGoogleCredential(credential);
  const isSuperAdmin = await isSuperAdminEmail(googleUser.email);

  let profile = await Profile.findOne({ email: googleUser.email });
  if (!profile) {
    const invitedMembership = await FactoryMember.findOne({ email: googleUser.email });
    profile = await Profile.create({
      ...googleUser,
      globalRole: isSuperAdmin ? 'super_admin' : 'factory_user',
      lastLoginAt: new Date(),
    });
    if (invitedMembership) {
      invitedMembership.profileId = profile._id;
      invitedMembership.status = invitedMembership.status === 'invited' ? 'active' : invitedMembership.status;
      await invitedMembership.save();
    }
  } else {
    profile.fullName = googleUser.fullName || profile.fullName;
    profile.avatarUrl = googleUser.avatarUrl || profile.avatarUrl;
    profile.googleSubject = googleUser.googleSubject || profile.googleSubject;
    profile.globalRole = isSuperAdmin ? 'super_admin' : profile.globalRole;
    profile.lastLoginAt = new Date();
    await profile.save();
  }

  const memberships = await FactoryMember.find({ profileId: profile._id, status: 'active' }).populate('factoryId');
  const token = signSession(profile);
  const primaryMembership = memberships.find((membership) => membership.role === 'employee')
    || memberships.find((membership) => membership.role === 'factory_admin')
    || memberships[0]
    || null;

  return {
    token,
    profile,
    primaryRole: isSuperAdmin
      ? 'super_admin'
      : primaryMembership?.role === 'employee'
        ? 'employee'
        : 'admin',
    memberships: memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      employeeRole: membership.employeeRole,
      status: membership.status,
      factory: membership.factoryId,
    })),
  };
}

export async function currentUser(profile) {
  const memberships = await FactoryMember.find({ profileId: profile._id, status: 'active' }).populate('factoryId');
  const primaryMembership = memberships.find((membership) => membership.role === 'employee')
    || memberships.find((membership) => membership.role === 'factory_admin')
    || memberships[0]
    || null;
  return {
    profile,
    primaryRole: profile.globalRole === 'super_admin'
      ? 'super_admin'
      : primaryMembership?.role === 'employee'
        ? 'employee'
        : 'admin',
    memberships: memberships.map((membership) => ({
      id: membership.id,
      role: membership.role,
      employeeRole: membership.employeeRole,
      status: membership.status,
      factory: membership.factoryId,
    })),
  };
}

export async function inviteFactoryMember(factoryId, payload) {
  const factory = await Factory.findById(factoryId);
  if (!factory) throw new ApiError(StatusCodes.NOT_FOUND, 'Factory not found');

  const email = payload.email.trim().toLowerCase();
  const profile = await Profile.findOne({ email });
  const membership = await FactoryMember.findOneAndUpdate(
    { factoryId, email },
    {
      factoryId,
      profileId: profile?._id ?? undefined,
      email,
      role: payload.role,
      employeeRole: payload.employeeRole || '',
      status: profile ? 'active' : 'invited',
    },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );

  return membership;
}
