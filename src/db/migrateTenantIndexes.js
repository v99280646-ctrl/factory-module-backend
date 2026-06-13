import 'dotenv/config';

import mongoose from 'mongoose';

import { env } from '../config/env.js';
import '../modules/operations/operations.model.js';
import '../modules/factory/factory.model.js';
import '../modules/auth/auth.model.js';

const legacyIndexes = [
  ['customers', 'company_1'],
  ['vendors', 'name_1'],
  ['services', 'name_1'],
  ['stockitems', 'material_1_type_1'],
  ['wastematerials', 'code_1'],
  ['projects', 'code_1'],
  ['invoices', 'invoiceNo_1'],
  ['appsettings', 'scope_1'],
  ['notificationsettings', 'audience_1_label_1'],
];

async function dropIndexIfExists(collectionName, indexName) {
  const collection = mongoose.connection.db.collection(collectionName);
  const indexes = await collection.indexes();
  if (!indexes.some((index) => index.name === indexName)) return;
  await collection.dropIndex(indexName);
  console.log(`Dropped ${collectionName}.${indexName}`);
}

async function main() {
  await mongoose.connect(env.MONGODB_URI);
  for (const [collectionName, indexName] of legacyIndexes) {
    await dropIndexIfExists(collectionName, indexName);
  }
  await mongoose.connection.syncIndexes();
  await mongoose.disconnect();
  console.log('Tenant indexes migrated');
}

main().catch(async (error) => {
  console.error(error);
  await mongoose.disconnect();
  process.exit(1);
});
