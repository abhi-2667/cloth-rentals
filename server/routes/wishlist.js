const express = require('express');
const router = express.Router();
const { getWishlist, toggleWishlist } = require('../controllers/wishlistController');
const { protect, approvedAccount } = require('../middleware/authMiddleware');

router.get('/', protect, approvedAccount, getWishlist);
router.post('/toggle', protect, approvedAccount, toggleWishlist);

module.exports = router;
