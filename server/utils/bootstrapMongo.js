const User = require('../models/User');
const Cloth = require('../models/Cloth');
const devStore = require('./devStore');
const bcrypt = require('bcrypt');

const migrateUsers = async () => {
  const userSummaries = devStore.listUsers();
  let inserted = 0;

  for (const summary of userSummaries) {
    const sourceUser = devStore.findUserByEmail(summary.email);
    if (!sourceUser) {
      continue;
    }

    const exists = await User.findOne({ email: sourceUser.email.toLowerCase() }).lean();
    if (exists) {
      continue;
    }

    await User.create({
      name: sourceUser.name,
      email: sourceUser.email.toLowerCase(),
      password: sourceUser.password,
      role: sourceUser.role || 'user',
      approvalStatus: sourceUser.approvalStatus || 'approved',
    });

    inserted += 1;
  }

  return inserted;
};

const migrateClothes = async () => {
  const clothes = devStore.listClothes();
  let inserted = 0;

  for (const cloth of clothes) {
    const exists = await Cloth.findOne({
      title: cloth.title,
      category: cloth.category,
      size: cloth.size,
    }).lean();

    if (exists) {
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
      occasion: cloth.occasion || cloth.category,
      gender: cloth.gender || 'unisex',
    });

    inserted += 1;
  }

  return inserted;
};

const seedMongoDemoDataIfEmpty = async () => {
  const [userCount, clothCount] = await Promise.all([
    User.countDocuments(),
    Cloth.countDocuments(),
  ]);

  if (userCount > 0 && clothCount > 0) {
    return { usersInserted: 0, clothesInserted: 0 };
  }

  await devStore.seedInventory();

  const [usersInserted, clothesInserted] = await Promise.all([
    userCount === 0 ? migrateUsers() : Promise.resolve(0),
    clothCount === 0 ? migrateClothes() : Promise.resolve(0),
  ]);

  const demoAccounts = [
    {
      name: 'Studio Admin',
      email: 'admin@cloth-rental.local',
      password: 'Admin1234!',
      role: 'admin',
      approvalStatus: 'approved',
    },
    {
      name: 'Studio User',
      email: 'user@cloth-rental.local',
      password: 'User1234!',
      role: 'user',
      approvalStatus: 'approved',
    },
  ];

  let demoUsersUpserted = 0;
  for (const account of demoAccounts) {
    const existing = await User.findOne({ email: account.email }).lean();
    const hashedPassword = await bcrypt.hash(account.password, 10);

    if (!existing) {
      await User.create({
        name: account.name,
        email: account.email,
        password: hashedPassword,
        role: account.role,
        approvalStatus: account.approvalStatus,
      });
      demoUsersUpserted += 1;
      continue;
    }

    const updates = {
      name: account.name,
      role: account.role,
      approvalStatus: account.approvalStatus,
      password: hashedPassword,
    };

    await User.updateOne({ email: account.email }, { $set: updates });
  }

  return { usersInserted: usersInserted + demoUsersUpserted, clothesInserted };
};

module.exports = { seedMongoDemoDataIfEmpty };