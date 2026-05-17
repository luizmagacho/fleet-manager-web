/**
 * seed-admin.js
 * Run with: node seed-admin.js
 * Creates (or updates) the admin user in local MongoDB.
 */
const { MongoClient } = require('mongodb');
const bcrypt = require('bcryptjs');

const MONGO_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/gestor-frota-pr';

const ADMIN = {
  email: 'magacholuiz@gmail.com',
  name: 'Luiz Admin',
  password: 'Ly181198!',
  role: 'ADMIN',
  isActive: true,
};

async function main() {
  const client = new MongoClient(MONGO_URI);
  try {
    await client.connect();
    console.log('✅ Connected to MongoDB');

    const db = client.db();
    const users = db.collection('users');

    const existing = await users.findOne({ email: ADMIN.email });
    const hashedPassword = await bcrypt.hash(ADMIN.password, 12);

    if (existing) {
      await users.updateOne(
        { email: ADMIN.email },
        { $set: { password: hashedPassword, role: ADMIN.role, isActive: true, updatedAt: new Date() } },
      );
      console.log(`🔄 Admin user updated: ${ADMIN.email}`);
    } else {
      await users.insertOne({
        email: ADMIN.email,
        name: ADMIN.name,
        password: hashedPassword,
        role: ADMIN.role,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      });
      console.log(`🆕 Admin user created: ${ADMIN.email}`);
    }

    console.log('');
    console.log('─────────────────────────────────────');
    console.log('  Login credentials:');
    console.log(`  Email : ${ADMIN.email}`);
    console.log(`  Senha : ${ADMIN.password}`);
    console.log(`  Role  : ${ADMIN.role}`);
    console.log('─────────────────────────────────────');
  } finally {
    await client.close();
  }
}

main().catch((err) => {
  console.error('❌ Seed failed:', err.message);
  process.exit(1);
});
