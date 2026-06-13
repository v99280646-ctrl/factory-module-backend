import { StatusCodes } from 'http-status-codes';
import mongoose from 'mongoose';

import ApiError from '../../utils/ApiError.js';
import { FactoryMember, Profile } from '../auth/auth.model.js';
import {
  AppSetting,
  Customer,
  Invoice,
  MaterialUsageLog,
  NotificationSetting,
  Project,
  Service,
  Staff,
  StockItem,
  Transaction,
  Vendor,
  WasteMaterial,
} from './operations.model.js';

const models = {
  customers: Customer,
  vendors: Vendor,
  staff: Staff,
  services: Service,
  stock: StockItem,
  waste: WasteMaterial,
  projects: Project,
  'usage-logs': MaterialUsageLog,
  transactions: Transaction,
  invoices: Invoice,
  settings: AppSetting,
  notifications: NotificationSetting,
};

const sortByResource = {
  customers: { company: 1 },
  vendors: { name: 1 },
  staff: { createdAt: -1 },
  services: { name: 1 },
  stock: { material: 1 },
  waste: { createdAt: -1 },
  projects: { createdAt: -1 },
  'usage-logs': { createdAt: -1 },
  transactions: { transactionDate: -1 },
  invoices: { invoiceDate: -1 },
  settings: { scope: 1 },
  notifications: { audience: 1, label: 1 },
};

const defaultServices = [
  { name: 'Pressing', price: 180, unit: 'sheet' },
  { name: 'Cutting', price: 90, unit: 'sheet' },
  { name: 'Edge band', price: 60, unit: 'meter' },
  { name: 'Boring', price: 75, unit: 'hole' },
  { name: 'Packing', price: 0, unit: 'project' },
  { name: 'Packing & Delivery', price: 0, unit: 'km' },
];

const defaultStock = [
  { material: 'MDF Sheet 18mm', type: 'MDF', quantity: 120, unit: 'sheets' },
  { material: 'Plywood 19mm', type: 'Plywood', quantity: 85, unit: 'sheets' },
  { material: 'Laminate - Walnut', type: 'Laminate', quantity: 200, unit: 'sheets' },
  { material: 'Veneer - Teak', type: 'Veneer', quantity: 60, unit: 'sheets' },
  { material: 'Edge Band Tape 22mm', type: 'Edge Band', quantity: 320, unit: 'rolls' },
];

const defaultNotificationSettings = [
  { audience: 'admin', label: 'Project onboarding', enabled: true },
  { audience: 'admin', label: 'Project completion', enabled: true },
  { audience: 'admin', label: 'Daily reports', enabled: true },
  { audience: 'customer', label: 'Project status', enabled: true },
  { audience: 'customer', label: 'Invoice', enabled: true },
];

function getModel(resource) {
  const model = models[resource];
  if (!model) throw new ApiError(StatusCodes.NOT_FOUND, `Unknown resource: ${resource}`);
  return model;
}

function ensureObjectId(id, label = 'id') {
  if (!mongoose.Types.ObjectId.isValid(id)) {
    throw new ApiError(StatusCodes.BAD_REQUEST, `Invalid ${label}`);
  }
  return id;
}

function getFactoryId(scope) {
  const factoryId = scope?.factoryId;
  if (!factoryId) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'Factory context is required');
  }
  return ensureObjectId(String(factoryId), 'factoryId');
}

function withFactory(scope, filter = {}) {
  return { ...filter, factoryId: getFactoryId(scope) };
}

function handleDuplicate(error, resource) {
  if (error.code === 11000) {
    throw new ApiError(StatusCodes.CONFLICT, `${resource} already exists`);
  }
  throw error;
}

function serviceToWorkflowStage(serviceName) {
  const name = serviceName.toLowerCase();
  if (name.includes('press')) return 'Pressing';
  if (name.includes('cut')) return 'Cutting';
  if (name.includes('edge')) return 'Edge band';
  if (name.includes('bor')) return 'Boring';
  if (name.includes('pack')) return 'Packing';
  if (name.includes('deliver')) return 'Deliverd';
  return serviceName;
}

async function makeProjectCode(scope) {
  const factoryId = getFactoryId(scope);
  const prefix = `P${Date.now().toString().slice(-6)}`;
  const exists = await Project.exists({ factoryId, code: prefix });
  if (!exists) return prefix;
  return `P${Date.now().toString().slice(-6)}${Math.floor(Math.random() * 90 + 10)}`;
}

export async function makeWasteCode(scope) {
  const rows = await WasteMaterial.find(withFactory(scope, { code: /^W\d+$/i })).select('code').lean();
  const currentNumber = rows.reduce((max, row) => {
    const value = Number(String(row.code).replace(/\D/g, ''));
    return Number.isFinite(value) ? Math.max(max, value) : max;
  }, 0);
  return `W${String(currentNumber + 1).padStart(3, '0')}`;
}

export async function listResource(resource, query = {}, scope) {
  const Model = getModel(resource);
  const filter = withFactory(scope);

  if (query.status && resource === 'projects') filter.status = query.status;
  if (query.type && resource === 'transactions') filter.type = query.type;
  if (query.audience && resource === 'notifications') filter.audience = query.audience;

  return Model.find(filter).sort(sortByResource[resource] ?? { createdAt: -1 });
}

export async function getResource(resource, id, scope) {
  const Model = getModel(resource);
  const record = await Model.findOne(withFactory(scope, { _id: ensureObjectId(id) }));
  if (!record) throw new ApiError(StatusCodes.NOT_FOUND, `${resource} record not found`);
  return record;
}

export async function createResource(resource, payload, scope) {
  const Model = getModel(resource);
  try {
    const factoryId = getFactoryId(scope);
    const body =
      resource === 'waste' && !payload.code
        ? { ...payload, code: await makeWasteCode(scope) }
        : payload;
    body.factoryId = factoryId;
    const record = await Model.create(body);
    if (resource === 'staff' && record.email) {
      const profile = await Profile.findOne({ email: record.email });
      await FactoryMember.findOneAndUpdate(
        { factoryId, email: record.email },
        {
          factoryId,
          profileId: profile?._id ?? undefined,
          email: record.email,
          role: 'employee',
          employeeRole: record.role,
          status: record.active ? 'active' : 'disabled',
        },
        { upsert: true, new: true, runValidators: true, setDefaultsOnInsert: true }
      );
    }
    return record;
  } catch (error) {
    handleDuplicate(error, resource);
  }
}

export async function updateResource(resource, id, payload, scope) {
  const Model = getModel(resource);
  try {
    delete payload.factoryId;
    const record = await Model.findOneAndUpdate(withFactory(scope, { _id: ensureObjectId(id) }), payload, {
      new: true,
      runValidators: true,
    });
    if (!record) throw new ApiError(StatusCodes.NOT_FOUND, `${resource} record not found`);
    if (resource === 'staff' && record.email) {
      await FactoryMember.findOneAndUpdate(
        { factoryId: getFactoryId(scope), email: record.email },
        {
          employeeRole: record.role,
          status: record.active ? 'active' : 'disabled',
        },
        { new: true, runValidators: true }
      );
    }
    return record;
  } catch (error) {
    handleDuplicate(error, resource);
  }
}

export async function deleteResource(resource, id, scope) {
  const Model = getModel(resource);
  const record = await Model.findOneAndDelete(withFactory(scope, { _id: ensureObjectId(id) }));
  if (!record) throw new ApiError(StatusCodes.NOT_FOUND, `${resource} record not found`);
  if (resource === 'staff' && record.email) {
    await FactoryMember.findOneAndUpdate(
      { factoryId: getFactoryId(scope), email: record.email },
      { status: 'disabled' },
      { new: true }
    );
  }
  return record;
}

export async function createProject(payload, scope) {
  const factoryId = getFactoryId(scope);
  const materials = (payload.materials ?? []).filter((material) => Number(material.quantity) > 0);
  if (!materials.length) throw new ApiError(StatusCodes.BAD_REQUEST, 'At least one material is required');

  let customer = null;
  if (payload.customerId) {
    customer = await Customer.findOne(withFactory(scope, { _id: ensureObjectId(payload.customerId, 'customerId') }));
  }
  if (!customer && payload.customerName) {
    customer = await Customer.findOne(
      withFactory(scope, { company: payload.customerName })
    ).collation({ locale: 'en', strength: 2 });
  }

  for (const material of materials) {
    if (material.source !== 'inventory') continue;
    const stock = await StockItem.findOne(withFactory(scope, { _id: ensureObjectId(material.stockItemId, 'stockItemId') }));
    if (!stock) throw new ApiError(StatusCodes.NOT_FOUND, `${material.materialName} stock not found`);
    if (stock.quantity < Number(material.quantity)) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `${stock.material} exceeds available stock`);
    }
  }

  const preparedMaterials = [];
  for (const material of materials) {
    let stockItemId = material.stockItemId || null;
    if (material.source === 'new-stock') {
      const materialName = material.materialName || `${material.materialType} ${material.thickness || ''}`.trim();
      const stock = await StockItem.findOneAndUpdate(
        { factoryId, material: materialName, type: material.materialType },
        {
          $setOnInsert: {
            factoryId,
            material: materialName,
            type: material.materialType,
            unit: material.unit || 'sheets',
            lowStockAt: 10,
          },
          $inc: { quantity: Number(material.quantity) },
        },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      );
      stockItemId = stock._id;
    }
    preparedMaterials.push({
      ...material,
      stockItemId,
    });
  }

  const selectedServices = [];
  for (const serviceInput of payload.services ?? []) {
    if (serviceInput.serviceId) {
      const service = await Service.findOne(withFactory(scope, { _id: ensureObjectId(serviceInput.serviceId, 'serviceId') }));
      if (!service) throw new ApiError(StatusCodes.NOT_FOUND, 'Service not found');
      selectedServices.push({
        serviceId: service.id,
        serviceName: serviceInput.serviceName || service.name,
        unit: service.unit,
      });
    } else if (serviceInput.serviceName) {
      selectedServices.push({
        serviceId: null,
        serviceName: serviceInput.serviceName,
        unit: serviceInput.unit || '',
      });
    }
  }

  const totalQuantity = preparedMaterials.reduce((sum, material) => sum + Number(material.quantity || 0), 0);
  const workflowNames = [
    'Meterials Recived',
    ...selectedServices.map((service) => serviceToWorkflowStage(service.serviceName)),
    'Packing',
    'Deliverd',
  ];

  const project = await Project.create({
    factoryId,
    code: payload.code || (await makeProjectCode(scope)),
    name: payload.name,
    customerId: customer?._id ?? null,
    customerName: payload.customerName || customer?.company,
    workType: payload.workType || 'own',
    status: payload.status || 'ongoing',
    progress: payload.progress ?? 5,
    delivery: payload.delivery || null,
    amount: payload.amount ?? 0,
    notes: payload.notes || '',
    materials: preparedMaterials.map((material) => ({
      source: material.source || 'new-stock',
      stockItemId: material.stockItemId || null,
      materialName: material.materialName || material.materialType,
      materialType: material.materialType,
      thickness: material.thickness || '',
      quantity: Number(material.quantity),
      unit: material.unit || 'sheets',
    })),
    services: selectedServices,
    workflowStages: Array.from(new Set(workflowNames)).map((name, index) => ({
      name,
      completed: index === 0 ? totalQuantity : 0,
      total: totalQuantity,
      sortOrder: index,
    })),
  });

  return project;
}

function findStage(project, stageName) {
  const requested = stageName.toLowerCase();
  return project.workflowStages.find((stage) => stage.name.toLowerCase() === requested);
}

function getProjectMaterial(project, materialId) {
  return project.materials.id(materialId) || project.materials.find((material) => String(material._id) === String(materialId));
}

export async function allocateProjectStage(projectId, stageName, materialAllocations, scope) {
  const project = await Project.findOne(withFactory(scope, { _id: ensureObjectId(projectId, 'projectId') }));
  if (!project) throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');

  const stage = findStage(project, stageName);
  if (!stage) throw new ApiError(StatusCodes.NOT_FOUND, 'Project stage not found');
  if (!Array.isArray(materialAllocations) || materialAllocations.length === 0) {
    throw new ApiError(StatusCodes.BAD_REQUEST, 'At least one stage material is required');
  }

  stage.materials = materialAllocations
    .filter((allocation) => Number(allocation.requiredQuantity) > 0)
    .map((allocation) => {
      const projectMaterial = getProjectMaterial(project, allocation.projectMaterialId);
      if (!projectMaterial) throw new ApiError(StatusCodes.NOT_FOUND, 'Project material not found');
      if (Number(allocation.requiredQuantity) > Number(projectMaterial.quantity)) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `${projectMaterial.materialName} exceeds project required quantity`);
      }
      return {
        projectMaterialId: projectMaterial._id,
        stockItemId: projectMaterial.stockItemId || null,
        materialName: projectMaterial.materialName,
        materialType: projectMaterial.materialType,
        requiredQuantity: Number(allocation.requiredQuantity),
        completedQuantity: 0,
        unit: projectMaterial.unit,
      };
    });

  stage.total = stage.materials.reduce((sum, material) => sum + Number(material.requiredQuantity || 0), 0);
  stage.completed = 0;
  await project.save();
  return project;
}

export async function recordProjectStageUsage(projectId, stageName, payload, scope) {
  const factoryId = getFactoryId(scope);
  const project = await Project.findOne(withFactory(scope, { _id: ensureObjectId(projectId, 'projectId') }));
  if (!project) throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');

  const stage = findStage(project, stageName);
  if (!stage) throw new ApiError(StatusCodes.NOT_FOUND, 'Project stage not found');
  if (!stage.materials?.length) throw new ApiError(StatusCodes.BAD_REQUEST, 'Stage materials are not allocated yet');

  const usageRows = (payload.materials ?? []).filter((row) => Number(row.quantityUsed) > 0);
  if (!usageRows.length) throw new ApiError(StatusCodes.BAD_REQUEST, 'At least one used quantity is required');

  const logs = [];
  for (const row of usageRows) {
    const stageMaterial = stage.materials.find((material) => String(material.projectMaterialId) === String(row.projectMaterialId));
    if (!stageMaterial) throw new ApiError(StatusCodes.NOT_FOUND, 'Stage material not found');

    const quantityUsed = Number(row.quantityUsed);
    const remaining = Number(stageMaterial.requiredQuantity) - Number(stageMaterial.completedQuantity);
    if (quantityUsed > remaining) {
      throw new ApiError(StatusCodes.BAD_REQUEST, `${stageMaterial.materialName} exceeds remaining stage quantity`);
    }

    let stock = null;
    if (stageMaterial.stockItemId) {
      stock = await StockItem.findOne(withFactory(scope, { _id: stageMaterial.stockItemId }));
    }
    if (!stock) {
      stock = await StockItem.findOne({
        factoryId,
        $or: [
          { material: stageMaterial.materialName, type: stageMaterial.materialType },
          { type: stageMaterial.materialType },
        ],
      }).sort({ quantity: -1 });
    }
    if (stock) {
      if (stock.quantity < quantityUsed) {
        throw new ApiError(StatusCodes.BAD_REQUEST, `${stock.material} has only ${stock.quantity} ${stock.unit} available`);
      }
      stock.quantity -= quantityUsed;
      await stock.save();
      stageMaterial.stockItemId = stock._id;
    }

    stageMaterial.completedQuantity = Number(stageMaterial.completedQuantity) + quantityUsed;
    logs.push({
      projectId: project._id,
      factoryId,
      projectCode: project.code,
      projectName: project.name,
      stageName: stage.name,
      role: payload.role || '',
      staffName: payload.staffName || '',
      projectMaterialId: stageMaterial.projectMaterialId,
      stockItemId: stageMaterial.stockItemId || null,
      materialName: stageMaterial.materialName,
      materialType: stageMaterial.materialType,
      quantityUsed,
      unit: stageMaterial.unit,
      note: payload.note || '',
    });
  }

  stage.completed = stage.materials.reduce((sum, material) => sum + Number(material.completedQuantity || 0), 0);
  stage.total = stage.materials.reduce((sum, material) => sum + Number(material.requiredQuantity || 0), 0);

  const completedStages = project.workflowStages.filter(
    (item) => Number(item.total) > 0 && Number(item.completed) >= Number(item.total)
  ).length;
  project.progress = project.workflowStages.length
    ? Math.round((completedStages / project.workflowStages.length) * 100)
    : project.progress;

  await project.save();
  if (logs.length) await MaterialUsageLog.insertMany(logs);
  return project;
}

export async function updateProjectWorkflow(projectId, stages, scope) {
  const project = await Project.findOne(withFactory(scope, { _id: ensureObjectId(projectId, 'projectId') }));
  if (!project) throw new ApiError(StatusCodes.NOT_FOUND, 'Project not found');
  project.workflowStages = stages;

  const completed = stages.filter((stage) => Number(stage.total) > 0 && Number(stage.completed) >= Number(stage.total)).length;
  project.progress = stages.length ? Math.round((completed / stages.length) * 100) : project.progress;
  await project.save();
  return project;
}

export async function updateStockQuantity(stockId, quantity, scope) {
  const stock = await StockItem.findOneAndUpdate(
    withFactory(scope, { _id: ensureObjectId(stockId, 'stockId') }),
    { quantity },
    { new: true, runValidators: true }
  );
  if (!stock) throw new ApiError(StatusCodes.NOT_FOUND, 'Stock item not found');
  return stock;
}

export async function upsertNotification(payload, scope) {
  return NotificationSetting.findOneAndUpdate(
    withFactory(scope, { audience: payload.audience, label: payload.label }),
    { enabled: payload.enabled, factoryId: getFactoryId(scope) },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

export async function upsertSetting(settingScope, config, scope) {
  return AppSetting.findOneAndUpdate(
    withFactory(scope, { scope: settingScope }),
    { config, factoryId: getFactoryId(scope) },
    { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
  );
}

export async function dashboardSummary(scope) {
  const [projects, transactions, lowStock] = await Promise.all([
    Project.find(withFactory(scope)).sort({ createdAt: -1 }).limit(8),
    Transaction.find(withFactory(scope)).sort({ transactionDate: -1 }).limit(12),
    StockItem.find(withFactory(scope, { $expr: { $lte: ['$quantity', '$lowStockAt'] } })).sort({ quantity: 1 }),
  ]);

  const allProjects = await Project.find(withFactory(scope));
  const revenue = allProjects
    .filter((project) => project.status === 'completed')
    .reduce((sum, project) => sum + project.amount, 0);

  return {
    stats: {
      totalProjects: allProjects.length,
      activeProjects: allProjects.filter((project) => project.status === 'ongoing').length,
      completedProjects: allProjects.filter((project) => project.status === 'completed').length,
      revenue,
    },
    projectsByStatus: ['ongoing', 'completed', 'hold'].map((status) => ({
      status,
      count: allProjects.filter((project) => project.status === status).length,
    })),
    recentProjects: projects,
    recentTransactions: transactions,
    lowStock,
  };
}

export async function seedDefaults(scope) {
  const factoryId = getFactoryId(scope);
  if ((await Service.countDocuments({ factoryId })) === 0) {
    await Service.insertMany(defaultServices.map((service) => ({ ...service, factoryId })));
  }
  if ((await StockItem.countDocuments({ factoryId })) === 0) {
    await StockItem.insertMany(defaultStock.map((stock) => ({ ...stock, factoryId })));
  }
  for (const setting of defaultNotificationSettings) {
    await NotificationSetting.updateOne(
      { factoryId, audience: setting.audience, label: setting.label },
      { $setOnInsert: { ...setting, factoryId } },
      { upsert: true }
    );
  }

  return {
    services: await Service.countDocuments({ factoryId }),
    stock: await StockItem.countDocuments({ factoryId }),
    notifications: await NotificationSetting.countDocuments({ factoryId }),
  };
}
