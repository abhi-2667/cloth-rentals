const Booking = require('../models/Booking');
const Cloth = require('../models/Cloth');
const Notification = require('../models/Notification');
const devStore = require('../utils/devStore');

const useDevStore = !process.env.MONGO_URI;

const createUserNotification = async ({ userId, type, title, message, metadata = {} }) => {
  if (useDevStore) {
    return devStore.addNotification({ userId, type, title, message, metadata });
  }

  return Notification.create({ userId, type, title, message, metadata });
};

const getNormalizedToday = () => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return today;
};

const createBooking = async (req, res) => {
  try {
    const { clothId, startDate, endDate } = req.body;

    if (useDevStore) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      if (start >= end) {
        return res.status(400).json({ message: 'End date must be after start date' });
      }

      if (start < today) {
        return res.status(400).json({ message: 'Start date cannot be in the past' });
      }

      const cloth = devStore.getClothById(clothId);
      if (!cloth) return res.status(404).json({ message: 'Cloth not found' });
      if (!cloth.availability) return res.status(400).json({ message: 'Cloth is currently unavailable overall' });

      const overlappingBookings = devStore.findOverlappingBookings(clothId, start, end);
      if (overlappingBookings.length > 0) {
        return res.status(400).json({ message: 'Cloth is already booked for these dates' });
      }

      const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
      const totalPrice = days * cloth.pricePerDay;

      const booking = devStore.createBooking({
        userId: req.user.id,
        clothId,
        startDate: start,
        endDate: end,
        totalPrice,
        status: 'booked',
      });

      await createUserNotification({
        userId: req.user.id,
        type: 'booking_confirmed',
        title: 'Booking confirmed',
        message: `${cloth.title} is booked from ${start.toDateString()} to ${end.toDateString()}.`,
        metadata: { bookingId: booking._id, clothId },
      });

      return res.status(201).json(booking);
    }
    
    const start = new Date(startDate);
    const end = new Date(endDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (start >= end) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    if (start < today) {
      return res.status(400).json({ message: 'Start date cannot be in the past' });
    }

    const cloth = await Cloth.findById(clothId);
    if (!cloth) return res.status(404).json({ message: 'Cloth not found' });
    if (!cloth.availability) return res.status(400).json({ message: 'Cloth is currently unavailable overall' });

    // existingStart <= newEnd && existingEnd >= newStart
    const overlappingBookings = await Booking.find({
      clothId,
      status: 'booked',
      $and: [
        { startDate: { $lte: end } },
        { endDate: { $gte: start } }
      ]
    });

    if (overlappingBookings.length > 0) {
      return res.status(400).json({ message: 'Cloth is already booked for these dates' });
    }

    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24));
    const totalPrice = days * cloth.pricePerDay;

    const booking = await Booking.create({
      userId: req.user.id,
      clothId,
      startDate: start,
      endDate: end,
      totalPrice,
      status: 'booked'
    });

    await createUserNotification({
      userId: req.user.id,
      type: 'booking_confirmed',
      title: 'Booking confirmed',
      message: `${cloth.title} is booked from ${start.toDateString()} to ${end.toDateString()}.`,
      metadata: { bookingId: booking._id, clothId },
    });

    res.status(201).json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getBlockedDatesForCloth = async (req, res) => {
  try {
    const { clothId } = req.params;

    if (useDevStore) {
      return res.json(devStore.getBlockedRangesForCloth(clothId));
    }

    const bookings = await Booking.find({
      clothId,
      status: 'booked'
    })
      .select('startDate endDate')
      .sort({ startDate: 1 });

    const blockedRanges = bookings.map((booking) => ({
      startDate: booking.startDate,
      endDate: booking.endDate
    }));

    res.json(blockedRanges);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getUserBookings = async (req, res) => {
  try {
    if (useDevStore) {
      return res.json(devStore.listBookings({ userId: req.user.id, includeCloth: true }));
    }

    const bookings = await Booking.find({ userId: req.user.id }).populate('clothId');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getAllBookings = async (req, res) => {
  try {
    if (useDevStore) {
      return res.json(devStore.getAllBookings());
    }

   const bookings = await Booking.find().populate('clothId').populate('userId', 'name email phone address');
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const cancelBooking = async (req, res) => {
  try {
    const bookingId = req.params.id;

    if (useDevStore) {
      const booking = devStore.getBookingById(bookingId);
      if (!booking || booking.userId !== req.user.id) {
        return res.status(404).json({ message: 'Booking not found' });
      }

      if (booking.status !== 'booked') {
        return res.status(400).json({ message: 'Only active bookings can be cancelled' });
      }

      if (new Date(booking.startDate) <= getNormalizedToday()) {
        return res.status(400).json({ message: 'Bookings can only be cancelled before the rental start date' });
      }

      const cancelledBooking = devStore.updateBooking(bookingId, { status: 'cancelled' });
      const cloth = devStore.getClothById(cancelledBooking.clothId);

      await createUserNotification({
        userId: cancelledBooking.userId,
        type: 'booking_cancelled',
        title: 'Booking cancelled',
        message: `${cloth?.title || 'Your item'} booking for ${new Date(cancelledBooking.startDate).toDateString()} has been cancelled.`,
        metadata: { bookingId: cancelledBooking._id, clothId: cancelledBooking.clothId },
      });

      return res.json(cancelledBooking);
    }

    const booking = await Booking.findOne({ _id: bookingId, userId: req.user.id });
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    if (booking.status !== 'booked') {
      return res.status(400).json({ message: 'Only active bookings can be cancelled' });
    }

    if (new Date(booking.startDate) <= getNormalizedToday()) {
      return res.status(400).json({ message: 'Bookings can only be cancelled before the rental start date' });
    }

    booking.status = 'cancelled';
    await booking.save();

    const cloth = await Cloth.findById(booking.clothId).select('title');
    await createUserNotification({
      userId: booking.userId,
      type: 'booking_cancelled',
      title: 'Booking cancelled',
      message: `${cloth?.title || 'Your item'} booking for ${new Date(booking.startDate).toDateString()} has been cancelled.`,
      metadata: { bookingId: booking._id, clothId: booking.clothId },
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const returnCloth = async (req, res) => {
  try {
    if (useDevStore) {
      const booking = devStore.updateBooking(req.params.id, { status: 'returned' });
      if (!booking) return res.status(404).json({ message: 'Booking not found' });

      const cloth = devStore.getClothById(booking.clothId);
      await createUserNotification({
        userId: booking.userId,
        type: 'booking_returned',
        title: 'Return marked complete',
        message: `${cloth?.title || 'Your item'} has been marked as returned.`,
        metadata: { bookingId: booking._id, clothId: booking.clothId },
      });

      return res.json(booking);
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) return res.status(404).json({ message: 'Booking not found' });

    booking.status = 'returned';
    await booking.save();

    const cloth = await Cloth.findById(booking.clothId).select('title');
    await createUserNotification({
      userId: booking.userId,
      type: 'booking_returned',
      title: 'Return marked complete',
      message: `${cloth?.title || 'Your item'} has been marked as returned.`,
      metadata: { bookingId: booking._id, clothId: booking.clothId },
    });

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const requestReturn = async (req, res) => {
  try {
    if (useDevStore) {
      const booking = devStore.getBookingById(req.params.id);
      if (!booking || booking.userId !== req.user.id) return res.status(404).json({ message: 'Booking not found' });
      if (booking.status !== 'booked') return res.status(400).json({ message: 'Can only return active bookings' });

      const updated = devStore.updateBooking(req.params.id, { status: 'return_requested' });
      return res.json(updated);
    }

    const booking = await Booking.findOne({ _id: req.params.id, userId: req.user.id });
    if (!booking) return res.status(404).json({ message: 'Booking not found' });
    if (booking.status !== 'booked') return res.status(400).json({ message: 'Can only return active bookings' });

    booking.status = 'return_requested';
    await booking.save();
    
    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createBooking, getBlockedDatesForCloth, getUserBookings, getAllBookings, cancelBooking, returnCloth, requestReturn };
