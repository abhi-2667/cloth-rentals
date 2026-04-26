const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  type: { type: String, enum: ['booking_confirmed', 'booking_returned', 'booking_cancelled', 'account'], required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  metadata: { type: Object, default: {} },
  isRead: { type: Boolean, default: false }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
