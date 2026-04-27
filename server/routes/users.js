const express = require('express');
const router = express.Router();
const User = require('../models/User');
const Booking = require('../models/Booking');
const Notification = require('../models/Notification');

const bcrypt = require('bcrypt');
const { protect, admin, approvedAccount } = require('../middleware/authMiddleware');
const devStore = require('../utils/devStore');
const {
  validateObjectIdParam,
  validateRolePayload,
  validateApprovalPayload,
  validateProfileUpdatePayload,
} = require('../middleware/validationMiddleware');

const useDevStore = !process.env.MONGO_URI;
const normalizeEmail = (value) => String(value || '').trim().toLowerCase();
const toSafeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  role: user.role,
  approvalStatus: user.approvalStatus || 'approved',
  address: user.address || '',
  phone: user.phone || '',
  createdAt: user.createdAt,
});

const buildActivitySummary = ({ users, bookings }) => {
  const now = new Date();
  const cutoff14 = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);
  const cutoff30 = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const normalizedUsers = users.map((user) => ({
    id: String(user.id || user._id),
    name: user.name || 'User',
    email: user.email || '',
    role: user.role || 'user',
    approvalStatus: user.approvalStatus || 'approved',
    createdAt: new Date(user.createdAt),
  }));

  const normalizedBookings = bookings.map((booking) => {
    const userIdRaw = booking.userId?.id || booking.userId?._id || booking.userId;
    const userName = booking.userId?.name || booking.userName || 'User';
    const createdAt = new Date(booking.createdAt || booking.updatedAt || Date.now());
    const updatedAt = new Date(booking.updatedAt || booking.createdAt || Date.now());
    return {
      id: String(booking.id || booking._id),
      userId: String(userIdRaw || ''),
      userName,
      totalPrice: Number(booking.totalPrice || 0),
      status: booking.status || 'booked',
      createdAt,
      updatedAt,
    };
  });

  const recentSignups = normalizedUsers.filter((user) => user.createdAt >= cutoff14).length;
  const recentBookings = normalizedBookings.filter((booking) => booking.createdAt >= cutoff14).length;
  const pendingApprovals = normalizedUsers.filter((user) => user.approvalStatus === 'pending').length;

  const activeRentersSet = new Set(
    normalizedBookings
      .filter((booking) => booking.createdAt >= cutoff30 && booking.userId)
      .map((booking) => booking.userId)
  );

  const byUser = new Map();
  for (const booking of normalizedBookings) {
    if (!booking.userId) continue;

    const current = byUser.get(booking.userId) || {
      userId: booking.userId,
      userName: booking.userName,
      bookingsCount: 0,
      totalSpent: 0,
    };

    current.bookingsCount += 1;
    current.totalSpent += booking.totalPrice;
    byUser.set(booking.userId, current);
  }

  const topRenters = Array.from(byUser.values())
    .sort((left, right) => {
      if (right.bookingsCount !== left.bookingsCount) {
        return right.bookingsCount - left.bookingsCount;
      }
      return right.totalSpent - left.totalSpent;
    })
    .slice(0, 5);

  const signupEvents = normalizedUsers.map((user) => ({
    id: `signup-${user.id}`,
    type: 'signup',
    message: `${user.name} joined the platform`,
    timestamp: user.createdAt,
  }));

  const bookingEvents = normalizedBookings.map((booking) => ({
    id: `booking-${booking.id}`,
    type: 'booking',
    message: `${booking.userName} created a booking`,
    timestamp: booking.createdAt,
  }));

  const returnEvents = normalizedBookings
    .filter((booking) => booking.status === 'returned' && booking.updatedAt > booking.createdAt)
    .map((booking) => ({
      id: `return-${booking.id}`,
      type: 'return',
      message: `${booking.userName} booking was marked returned`,
      timestamp: booking.updatedAt,
    }));

  const recentEvents = [...signupEvents, ...bookingEvents, ...returnEvents]
    .sort((left, right) => right.timestamp - left.timestamp)
    .slice(0, 12)
    .map((event) => ({
      ...event,
      timestamp: event.timestamp.toISOString(),
    }));

  return {
    metrics: {
      recentSignups,
      recentBookings,
      pendingApprovals,
      activeRenters30d: activeRentersSet.size,
      totalUsers: normalizedUsers.length,
      totalBookings: normalizedBookings.length,
    },
    topRenters,
    recentEvents,
  };
};

router.get('/activity-summary', protect, approvedAccount, admin, async (req, res) => {
  try {
    if (useDevStore) {
      const users = devStore.listUsers();
      const bookings = devStore.getAllBookings();
      return res.json(buildActivitySummary({ users, bookings }));
    }

    const [users, bookings] = await Promise.all([
      User.find().select('_id name email role approvalStatus createdAt').lean(),
      Booking.find().select('_id userId totalPrice status createdAt updatedAt').populate('userId', 'name').lean(),
    ]);

    return res.json(buildActivitySummary({ users, bookings }));
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/profile', protect, approvedAccount, async (req, res) => {
  try {
    if (useDevStore) {
      const user = devStore.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ id: user._id, name: user.name, email: user.email, role: user.role, approvalStatus: user.approvalStatus || 'approved' });
    }

    const user = await User.findById(req.user.id).select('-password');
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    res.json({ id: user._id, name: user.name, email: user.email, role: user.role, approvalStatus: user.approvalStatus || 'approved', address: user.address || '', phone: user.phone || '' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/profile', protect, approvedAccount, validateProfileUpdatePayload, async (req, res) => {
  try {
    if (useDevStore) {
      const user = devStore.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const { name, email, password, address, phone } = req.body;
      const updates = {};
      const normalizedEmail = email !== undefined ? normalizeEmail(email) : undefined;

      if (name) updates.name = name;
      if (address !== undefined) updates.address = address;
      if (phone !== undefined) updates.phone = phone;
      if (normalizedEmail) {
        const emailInUse = devStore.listUsers().find((item) => item.email.toLowerCase() === normalizedEmail && item._id !== user._id);
        if (emailInUse) {
          return res.status(400).json({ message: 'Email already in use' });
        }

        updates.email = normalizedEmail;
      }

      if (password) {
        const salt = await bcrypt.genSalt(10);
        updates.password = await bcrypt.hash(password, salt);
      }

      const updatedUser = devStore.updateUser(req.user.id, updates);
      return res.json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        approvalStatus: updatedUser.approvalStatus || 'approved',
        address: updatedUser.address || '',
        phone: updatedUser.phone || '',
      });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const { name, email, password, address, phone } = req.body;
    const normalizedEmail = email !== undefined ? normalizeEmail(email) : undefined;

    if (name) user.name = name;
    if (address !== undefined) user.address = address;
    if (phone !== undefined) user.phone = phone;
    if (normalizedEmail) user.email = normalizedEmail;

    if (password) {
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);
    }

    const updatedUser = await user.save();
    res.json({
      id: updatedUser._id,
      name: updatedUser.name,
      email: updatedUser.email,
      role: updatedUser.role,
      approvalStatus: updatedUser.approvalStatus || 'approved',
      address: updatedUser.address || '',
      phone: updatedUser.phone || '',
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: 'Email already in use' });
    }
    res.status(500).json({ message: error.message });
  }
});

router.delete('/profile', protect, approvedAccount, async (req, res) => {
  try {
    const { password } = req.body || {};

    if (!password || String(password).length === 0) {
      return res.status(400).json({ message: 'Password is required to delete account' });
    }

    if (useDevStore) {
      const user = devStore.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const isPasswordValid = await bcrypt.compare(String(password), String(user.password || ''));
      if (!isPasswordValid) {
        return res.status(401).json({ message: 'Incorrect password' });
      }

      const deletion = devStore.deleteUserAccount(req.user.id);
      if (!deletion.ok) {
        if (deletion.reason === 'last_admin') {
          return res.status(400).json({ message: 'At least one approved admin account is required' });
        }

        return res.status(404).json({ message: 'User not found' });
      }

      return res.json({ message: 'Account deleted successfully' });
    }

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    const isPasswordValid = await bcrypt.compare(String(password), String(user.password || ''));
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Incorrect password' });
    }

    const approvalStatus = user.approvalStatus || 'approved';
    if (user.role === 'admin' && approvalStatus === 'approved') {
      const approvedAdminCount = await User.countDocuments({
        role: 'admin',
        $or: [{ approvalStatus: { $exists: false } }, { approvalStatus: 'approved' }],
      });

      if (approvedAdminCount <= 1) {
        return res.status(400).json({ message: 'At least one approved admin account is required' });
      }
    }

    await Promise.all([
      Notification.deleteMany({ userId: user._id }),
      User.deleteOne({ _id: user._id }),
    ]);

    return res.json({ message: 'Account deleted successfully' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
});

router.get('/notifications', protect, approvedAccount, async (req, res) => {
  try {
    if (useDevStore) {
      return res.json(devStore.listNotificationsForUser(req.user.id));
    }

    const notifications = await Notification.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/notifications/:id/read', protect, approvedAccount, validateObjectIdParam('id', 'notification ID'), async (req, res) => {
  try {
    if (useDevStore) {
      const notification = devStore.markNotificationAsRead(req.params.id, req.user.id);
      if (!notification) {
        return res.status(404).json({ message: 'Notification not found' });
      }
      return res.json(notification);
    }

    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.id },
      { isRead: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ message: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/', protect, approvedAccount, admin, async (req, res) => {
  try {
    if (useDevStore) {
      return res.json(devStore.listUsers());
    }

   const users = await User.find().select('_id name email role approvalStatus createdAt phone address').sort({ createdAt: -1 });
    res.json(users.map(toSafeUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/role', protect, approvedAccount, admin, validateObjectIdParam('id', 'user ID'), validateRolePayload, async (req, res) => {
  try {
    const { role } = req.body;

    if (!['user', 'admin'].includes(role)) {
      return res.status(400).json({ message: 'Role must be either user or admin' });
    }

    if (useDevStore) {
      const targetUser = devStore.getUserById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (targetUser._id === req.user.id && role !== 'admin') {
        return res.status(400).json({ message: 'You cannot remove your own admin role' });
      }

      if (targetUser.role === 'admin' && role === 'user' && devStore.countAdmins() <= 1) {
        return res.status(400).json({ message: 'At least one admin account is required' });
      }

      const updatedUser = devStore.updateUser(req.params.id, { role });
      return res.json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        approvalStatus: updatedUser.approvalStatus || 'approved',
        createdAt: updatedUser.createdAt,
      });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user.id && role !== 'admin') {
      return res.status(400).json({ message: 'You cannot remove your own admin role' });
    }

    if (targetUser.role === 'admin' && role === 'user') {
      const adminCount = await User.countDocuments({ role: 'admin' });
      if (adminCount <= 1) {
        return res.status(400).json({ message: 'At least one admin account is required' });
      }
    }

    targetUser.role = role;
    const updatedUser = await targetUser.save();

    res.json(toSafeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.put('/:id/approval', protect, approvedAccount, admin, validateObjectIdParam('id', 'user ID'), validateApprovalPayload, async (req, res) => {
  try {
    const { approvalStatus } = req.body;

    if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
      return res.status(400).json({ message: 'Approval status must be approved, rejected, or pending' });
    }

    if (useDevStore) {
      const targetUser = devStore.getUserById(req.params.id);
      if (!targetUser) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (targetUser._id === req.user.id) {
        return res.status(400).json({ message: 'You cannot change your own approval status' });
      }

      if (targetUser.role === 'admin' && approvalStatus !== 'approved' && devStore.countAdmins() <= 1) {
        return res.status(400).json({ message: 'At least one approved admin account is required' });
      }

      const updatedUser = devStore.updateUser(req.params.id, { approvalStatus });

      return res.json({
        id: updatedUser._id,
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        approvalStatus: updatedUser.approvalStatus || 'approved',
        createdAt: updatedUser.createdAt,
      });
    }

    const targetUser = await User.findById(req.params.id);
    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (targetUser._id.toString() === req.user.id) {
      return res.status(400).json({ message: 'You cannot change your own approval status' });
    }

    if (targetUser.role === 'admin' && approvalStatus !== 'approved') {
      const approvedAdminCount = await User.countDocuments({ role: 'admin', $or: [{ approvalStatus: { $exists: false } }, { approvalStatus: 'approved' }] });
      if (approvedAdminCount <= 1) {
        return res.status(400).json({ message: 'At least one approved admin account is required' });
      }
    }

    targetUser.approvalStatus = approvalStatus;
    const updatedUser = await targetUser.save();

    if (targetUser._id.toString() !== req.user.id) {
      await Notification.create({
        userId: targetUser._id,
        type: 'account',
        title: approvalStatus === 'approved' ? 'Account approved' : 'Account status updated',
        message: approvalStatus === 'approved'
          ? 'Your account has been approved. You can now sign in.'
          : approvalStatus === 'rejected'
            ? 'Your account was rejected by an administrator.'
            : 'Your account approval status is pending admin review.',
      });
    }

    return res.json(toSafeUser(updatedUser));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
