const User = require('../models/User');
const Notification = require('../models/Notification');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const devStore = require('../utils/devStore');

const useDevStore = !process.env.MONGO_URI;
const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret';

const generateToken = (id, role) => {
  return jwt.sign({ id, role }, getJwtSecret(), {
    expiresIn: process.env.JWT_EXPIRES_IN || '30d',
  });
};

const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

const demoLoginAccounts = {
  'admin@cloth-rental.local': {
    name: 'Studio Admin',
    role: 'admin',
    approvalStatus: 'approved',
    password: 'Admin1234!',
  },
  'user@cloth-rental.local': {
    name: 'Studio User',
    role: 'user',
    approvalStatus: 'approved',
    password: 'User1234!',
  },
};

const ensureDemoMongoUser = async (email) => {
  const normalizedEmail = normalizeEmail(email);
  const demo = demoLoginAccounts[normalizedEmail];
  if (!demo || useDevStore) return;

  const hashedPassword = await bcrypt.hash(demo.password, 10);
  await User.updateOne(
    { email: normalizedEmail },
    {
      $set: {
        name: demo.name,
        role: demo.role,
        approvalStatus: demo.approvalStatus,
        password: hashedPassword,
      },
      $setOnInsert: { email: normalizedEmail },
    },
    { upsert: true }
  );
};

const findUserByEmailInsensitive = async (email) => {
  const escaped = email.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return User.findOne({ email: new RegExp(`^${escaped}$`, 'i') });
};

const getApprovalStatus = (user) => user?.approvalStatus || 'approved';
const isApprovedUser = (user) => getApprovalStatus(user) === 'approved';

const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  approvalStatus: getApprovalStatus(user),
  address: user.address || '',
  phone: user.phone || '',
  createdAt: user.createdAt,
});

const getClientBaseUrl = (req) => {
  const configured = String(process.env.CLIENT_URL || '').trim();
  const requestOrigin = String(req?.headers?.origin || '').trim();
  if (String(process.env.NODE_ENV || '').toLowerCase() !== 'production' && requestOrigin) {
    return requestOrigin;
  }
  return configured || requestOrigin || 'http://localhost:3000';
};

const buildAdminApprovalLink = (req, pendingUserId) => {
  const url = new URL('/admin', getClientBaseUrl(req));
  url.searchParams.set('approvalUserId', String(pendingUserId));
  return url.toString();
};

const getFirstApprovedAdmin = async () => {
  if (useDevStore) {
    return devStore.listUsers().find(
      (user) => user.role === 'admin' && (user.approvalStatus || 'approved') === 'approved'
    ) || null;
  }
  return User.findOne({
    role: 'admin',
    $or: [{ approvalStatus: { $exists: false } }, { approvalStatus: 'approved' }],
  }).select('_id name email role approvalStatus');
};

// Notify admin via in-app notification when a new user registers
const notifyAdminAboutPendingSignup = async ({ req, pendingUser }) => {
  const adminUser = await getFirstApprovedAdmin();
  if (!adminUser) return;

  const adminUserId = adminUser.id || adminUser._id;
  const pendingUserId = String(pendingUser._id);
  const approvalLink = buildAdminApprovalLink(req, pendingUserId);
  const notificationTitle = 'New signup awaiting approval';
  const notificationMessage = `${pendingUser.name} (${pendingUser.email}) is waiting for review.`;

  if (useDevStore) {
    const existing = devStore.listNotificationsForUser(adminUserId).find((n) =>
      n.type === 'account' &&
      n.metadata?.kind === 'signup-approval' &&
      n.metadata?.pendingUserId === pendingUserId
    );
    if (!existing) {
      devStore.addNotification({
        userId: adminUserId,
        type: 'account',
        title: notificationTitle,
        message: notificationMessage,
        metadata: { kind: 'signup-approval', pendingUserId, approvalLink },
      });
    }
  } else {
    const existing = await Notification.findOne({
      userId: adminUserId,
      type: 'account',
      'metadata.kind': 'signup-approval',
      'metadata.pendingUserId': pendingUserId,
    });
    if (!existing) {
      await Notification.create({
        userId: adminUserId,
        type: 'account',
        title: notificationTitle,
        message: notificationMessage,
        metadata: { kind: 'signup-approval', pendingUserId, approvalLink },
      });
    }
  }
};

const registerUser = async (req, res) => {
  try {
    const { name, email, password, address, phone } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (!name || !normalizedEmail || !password) {
      return res.status(400).json({ message: 'Name, email, and password are required' });
    }

    if (useDevStore) {
      const userExists = devStore.findUserByEmail(normalizedEmail);
      if (userExists) return res.status(400).json({ message: 'User already exists' });

      const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
      const user = devStore.addUser({
        name,
        email: normalizedEmail,
        password: hashedPassword,
        address,
        phone,
        role: 'user',
        approvalStatus: 'pending',
      });

      await notifyAdminAboutPendingSignup({ req, pendingUser: user });

      return res.status(201).json({
        message: 'Account created. Waiting for admin approval.',
        user: toSafeUser(user),
      });
    }

    const userExists = await findUserByEmailInsensitive(normalizedEmail);
    if (userExists) return res.status(400).json({ message: 'User already exists' });

    const hashedPassword = await bcrypt.hash(password, await bcrypt.genSalt(10));
    const user = await User.create({
      name,
      email: normalizedEmail,
      password: hashedPassword,
      address,
      phone,
      role: 'user',
      approvalStatus: 'pending',
    });

    await notifyAdminAboutPendingSignup({ req, pendingUser: user });

    res.status(201).json({
      message: 'Account created. Waiting for admin approval.',
      user: toSafeUser(user),
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'User already exists' });
    }
    res.status(500).json({ message: error.message });
  }
};

const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;
    const normalizedEmail = normalizeEmail(email);

    if (useDevStore) {
      const user = devStore.findUserByEmail(normalizedEmail);

      if (user && !isApprovedUser(user)) {
        return res.status(403).json({ message: 'Account pending admin approval' });
      }

      if (user && (await bcrypt.compare(password, user.password))) {
        return res.json({
          user: toSafeUser(user),
          token: generateToken(user._id, user.role),
        });
      }

      return res.status(401).json({ message: 'Invalid email or password' });
    }

    await ensureDemoMongoUser(normalizedEmail);

    const escaped = normalizedEmail.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const users = await User.find({ email: new RegExp(`^${escaped}$`, 'i') });

    if (!users.length) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    for (const user of users) {
      let passwordMatches = false;

      if (typeof user.password === 'string' && user.password.startsWith('$2')) {
        passwordMatches = await bcrypt.compare(password, user.password);
      } else if (String(user.password || '') === String(password)) {
        // Upgrade legacy plain-text passwords
        user.password = await bcrypt.hash(password, await bcrypt.genSalt(10));
        await user.save();
        passwordMatches = true;
      }

      if (!passwordMatches) continue;

      if (!isApprovedUser(user)) {
        return res.status(403).json({ message: 'Account pending admin approval' });
      }

      return res.json({
        user: toSafeUser(user),
        token: generateToken(user._id, user.role),
      });
    }

    return res.status(401).json({ message: 'Invalid email or password' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { registerUser, loginUser };
