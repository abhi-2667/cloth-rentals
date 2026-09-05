const mongoose = require('mongoose');

const getUseDevStore = () => !process.env.MONGO_URI || mongoose.connection.readyState !== 1;
const getJwtSecret = () => process.env.JWT_SECRET || 'dev-secret';
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();

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

module.exports = {
  get useDevStore() { return getUseDevStore(); },
  getJwtSecret,
  normalizeEmail,
  getApprovalStatus,
  isApprovedUser,
  toSafeUser,
  demoLoginAccounts,
};
