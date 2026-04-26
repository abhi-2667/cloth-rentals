const mongoose = require('mongoose');
const dotenv = require('dotenv');

const devStore = require('../utils/devStore');
const User = require('../models/User');
const Cloth = require('../models/Cloth');

dotenv.config({ path: require('path').join(__dirname, '..', '.env') });

const migrateUsers = async () => {
  const userSummaries = devStore.listUsers();
  let inserted = 0;
  let skipped = 0;

  for (const summary of userSummaries) {
    const sourceUser = devStore.findUserByEmail(summary.email);
    if (!sourceUser) {
      skipped += 1;
      continue;
    }

    const exists = await User.findOne({ email: sourceUser.email.toLowerCase() }).lean();
    if (exists) {
      skipped += 1;
      continue;
    }

    await User.create({
      name: sourceUser.name,
      email: sourceUser.email.toLowerCase(),
      password: sourceUser.password,
      role: sourceUser.role || 'user',
    });

    inserted += 1;
  }

  return { inserted, skipped, total: userSummaries.length };
};

const migrateClothes = async () => {
  const clothes = devStore.listClothes();
  let inserted = 0;
  let skipped = 0;

  for (const cloth of clothes) {
    const exists = await Cloth.findOne({
      title: cloth.title,
      category: cloth.category,
      size: cloth.size,
    }).lean();

    if (exists) {
      skipped += 1;
      continue;
    }

    await Cloth.create({
      title: cloth.title,
      description: cloth.description,
      category: cloth.category,
      size: cloth.size,
      pricePerDay: cloth.pricePerDay,
      availability: cloth.availability,
      imageUrl: cloth.imageUrl,
    });

    inserted += 1;
  }

  return { inserted, skipped, total: clothes.length };
};

const run = async () => {
  try {
    if (!process.env.MONGO_URI) {
      throw new Error('MONGO_URI is missing in server/.env');
    }

    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB. Starting migration...');

    await devStore.seedInventory();

    const [usersResult, clothesResult] = await Promise.all([
      migrateUsers(),
      migrateClothes(),
    ]);

    console.log('Migration complete.');
    console.log('Users:', usersResult);
    console.log('Clothes:', clothesResult);
  } catch (error) {
    console.error('Migration failed:', error.message);
    process.exitCode = 1;
  } finally {
    await mongoose.connection.close().catch(() => undefined);
  }
};

run();
