import { connectDatabase, disconnectDatabase } from './mongoose.js';
import { SuperAdminAccess } from '../modules/auth/auth.model.js';

const email = process.argv[2];
const fullName = process.argv[3] || '';

if (!email) {
  console.error('Usage: node src/db/seedSuperAdmin.js <email> [fullName]');
  process.exit(1);
}

await connectDatabase();

await SuperAdminAccess.findOneAndUpdate(
  { email: email.trim().toLowerCase() },
  {
    email: email.trim().toLowerCase(),
    fullName,
    active: true,
  },
  { upsert: true, returnDocument: 'after', runValidators: true, setDefaultsOnInsert: true }
);

console.log(`Super admin access seeded for ${email.trim().toLowerCase()}`);

await disconnectDatabase();
