const express = require('express');
const router = express.Router();
const { addReview, getReviewsByCloth, deleteReview } = require('../controllers/reviewController');
const { protect, approvedAccount } = require('../middleware/authMiddleware');
const { validateObjectIdParam } = require('../middleware/validationMiddleware');

router.get('/cloth/:clothId', validateObjectIdParam('clothId', 'cloth ID'), getReviewsByCloth);
router.post('/', protect, approvedAccount, addReview);
router.delete('/:id', protect, approvedAccount, validateObjectIdParam('id', 'review ID'), deleteReview);

module.exports = router;
