const express = require('express');
const router = express.Router();
const { createBooking, getBlockedDatesForCloth, getUserBookings, getAllBookings, cancelBooking, returnCloth, requestReturn } = require('../controllers/bookingController');
const { protect, admin, approvedAccount } = require('../middleware/authMiddleware');
const { validateBookingPayload, validateObjectIdParam } = require('../middleware/validationMiddleware');

// Define /my route BEFORE /:id routes to avoid Express matching /my as an ID parameter
router.get('/my', protect, approvedAccount, getUserBookings);
router.get('/cloth/:clothId/blocked', validateObjectIdParam('clothId', 'cloth ID'), getBlockedDatesForCloth);

router.route('/')
  .post(protect, approvedAccount, validateBookingPayload, createBooking)
  .get(protect, approvedAccount, admin, getAllBookings);

router.put('/:id/cancel', protect, approvedAccount, validateObjectIdParam('id', 'booking ID'), cancelBooking);
router.put('/:id/request-return', protect, approvedAccount, validateObjectIdParam('id', 'booking ID'), requestReturn);
router.put('/:id/return', protect, approvedAccount, admin, validateObjectIdParam('id', 'booking ID'), returnCloth);

module.exports = router;
