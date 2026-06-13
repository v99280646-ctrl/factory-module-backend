import { FactoryMember, Profile, Subscription, Payment, SuperAdminAccess } from '../auth/auth.model.js';
import Factory from '../factory/factory.model.js';
import ApiError from '../../utils/ApiError.js';
import { StatusCodes } from 'http-status-codes';
import { Project } from '../operations/operations.model.js';

async function countActiveFactories() {
  return Factory.countDocuments({ status: 'active' });
}

async function countSuperAdmins() {
  return Profile.countDocuments({ globalRole: 'super_admin', active: true });
}

async function countFactoryUsers() {
  return Profile.countDocuments({ globalRole: 'factory_user', active: true });
}

async function totalRevenue() {
  const payments = await Payment.find({ status: 'paid' });
  return payments.reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
}

export async function dashboardSummary() {
  const [factories, activeFactoryCount, superAdminCount, factoryUserCount, revenue] = await Promise.all([
    Factory.find().sort({ createdAt: -1 }).limit(8),
    countActiveFactories(),
    countSuperAdmins(),
    countFactoryUsers(),
    totalRevenue(),
  ]);

  const [subscriptions, memberships, payments, profiles] = await Promise.all([
    Subscription.find().sort({ createdAt: -1 }).limit(8).populate('factoryId'),
    FactoryMember.find().sort({ createdAt: -1 }).limit(8).populate('factoryId'),
    Payment.find().sort({ createdAt: -1 }).limit(8).populate('factoryId'),
    Profile.find().sort({ lastLoginAt: -1 }).limit(8),
  ]);

  return {
    stats: {
      factories: activeFactoryCount,
      superAdmins: superAdminCount,
      factoryUsers: factoryUserCount,
      revenue,
    },
    recentFactories: factories,
    recentSubscriptions: subscriptions,
    recentMemberships: memberships,
    recentPayments: payments,
    recentProfiles: profiles,
  };
}

export async function listFactories() {
  const factories = await Factory.aggregate([
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
      $lookup: {
        from: 'payments',
        localField: '_id',
        foreignField: 'factoryId',
        as: 'payments',
      },
    },
    {
      $addFields: {
        id: { $toString: '$_id' },
        code: '$code',
        name: '$name',
        status: '$status',
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
        paymentCount: { $size: '$payments' },
        memberCount: { $size: '$members' },
        subscriptionPlan: {
          $ifNull: [{ $first: '$subscriptions.plan' }, 'trial'],
        },
        subscriptionStatus: {
          $ifNull: [{ $first: '$subscriptions.status' }, 'trial'],
        },
      },
    },
    {
      $project: {
        _id: 0,
        members: 0,
        subscriptions: 0,
        payments: 0,
      },
    },
    { $sort: { createdAt: -1 } },
  ]);

  return factories.map((factory) => ({
    ...factory,
    subscriptionPlan: factory.subscriptionPlan || factory.subscription?.plan || 'trial',
    subscriptionStatus: factory.subscriptionStatus || factory.subscription?.status || 'trial',
  }));
}

export async function getFactoryDetails(factoryId) {
  const factory = await Factory.findById(factoryId);
  if (!factory) {
    throw new ApiError(StatusCodes.NOT_FOUND, 'Factory not found');
  }

  const [memberships, projectCount, subscription, payments] = await Promise.all([
    FactoryMember.find({ factoryId }).populate('profileId').sort({ role: 1, createdAt: -1 }),
    Project.countDocuments({ factoryId }),
    Subscription.findOne({ factoryId }).sort({ createdAt: -1 }),
    Payment.find({ factoryId }).sort({ createdAt: -1 }).limit(10),
  ]);

  const adminMembership = memberships.find((member) => member.role === 'factory_admin') || null;
  const employeeMembers = memberships.filter((member) => member.role === 'employee');

  return {
    factory,
    admin: adminMembership
      ? {
          fullName: adminMembership.profileId?.fullName || adminMembership.email,
          role: adminMembership.role,
          phone: adminMembership.profileId?.phone || '',
          email: adminMembership.email,
          city: adminMembership.profileId?.city || '',
          state: adminMembership.profileId?.state || '',
          pincode: adminMembership.profileId?.pincode || '',
        }
      : null,
    employees: employeeMembers.map((member) => ({
      fullName: member.profileId?.fullName || member.email,
      role: member.employeeRole || member.role,
      loginDetails: {
        email: member.email,
        lastLoginAt: member.profileId?.lastLoginAt || null,
        active: member.status === 'active',
      },
    })),
    details: {
      companyName: factory.name,
      gstin: factory.gstin || '',
      phone: factory.phone || '',
      email: factory.email || adminMembership?.email || '',
      city: factory.city || '',
      state: factory.state || '',
      pincode: factory.pincode || '',
      address: factory.address || factory.location || '',
      subscription: subscription
        ? {
          plan: subscription.plan,
          status: subscription.status,
        }
        : null,
      payments: payments.map((payment) => ({
        id: payment.id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
      })),
      projectCount,
    },
  };
}

export async function createAccount(payload) {
  const email = payload.email.trim().toLowerCase();
  const profile = await Profile.findOneAndUpdate(
    { email },
    {
      email,
      fullName: payload.fullName || '',
      phone: payload.phone || '',
      city: payload.city || '',
      state: payload.state || '',
      pincode: payload.pincode || '',
      globalRole: payload.role === 'super_admin' ? 'super_admin' : 'factory_user',
      active: true,
      lastLoginAt: null,
    },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
  );

  if (payload.role === 'super_admin') {
    await SuperAdminAccess.findOneAndUpdate(
      { email },
      {
        email,
        fullName: payload.fullName || '',
        active: true,
      },
      { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
    );
    return profile;
  }

  if (!payload.factoryId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'factoryId is required for factory_admin and employee accounts');
  }

  await FactoryMember.findOneAndUpdate(
    { factoryId: payload.factoryId, email },
    {
      factoryId: payload.factoryId,
      email,
      profileId: profile._id,
      role: payload.role,
      employeeRole: payload.employeeRole || '',
      status: 'active',
    },
    { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
  );

  return profile;
}
