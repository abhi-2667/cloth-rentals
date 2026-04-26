const Review = require('../models/Review');
const Cloth = require('../models/Cloth');
const devStore = require('../utils/devStore');

const useDevStore = !process.env.MONGO_URI;

const getReviewsByCloth = async (req, res) => {
  try {
    const { clothId } = req.params;

    if (useDevStore) {
      return res.json(devStore.listReviewsForCloth(clothId));
    }

    const reviews = await Review.find({ clothId })
      .populate('userId', 'name email')
      .sort({ createdAt: -1 });

    return res.json(reviews);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const addReview = async (req, res) => {
  try {
    const { clothId, rating, comment } = req.body;
    const normalizedRating = Number(rating);

    if (!clothId) {
      return res.status(400).json({ message: 'clothId is required' });
    }

    if (!Number.isFinite(normalizedRating) || normalizedRating < 1 || normalizedRating > 5) {
      return res.status(400).json({ message: 'Rating must be a number between 1 and 5' });
    }

    if (useDevStore) {
      const cloth = devStore.getClothById(clothId);
      if (!cloth) {
        return res.status(404).json({ message: 'Cloth not found' });
      }

      const review = devStore.addReview({
        userId: req.user.id,
        clothId,
        rating: normalizedRating,
        comment,
      });

      return res.status(201).json(review);
    }

    const cloth = await Cloth.findById(clothId);
    if (!cloth) {
      return res.status(404).json({ message: 'Cloth not found' });
    }

    const review = await Review.create({
      userId: req.user.id,
      clothId,
      rating: normalizedRating,
      comment: String(comment || '').trim(),
    });

    return res.status(201).json(review);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    if (useDevStore) {
      const removed = devStore.deleteReview({ reviewId: id, userId: req.user.id });
      if (!removed) {
        return res.status(404).json({ message: 'Review not found' });
      }

      return res.json({ message: 'Review removed' });
    }

    const review = await Review.findOne({ _id: id, userId: req.user.id });
    if (!review) {
      return res.status(404).json({ message: 'Review not found' });
    }

    await Review.deleteOne({ _id: review._id });
    return res.json({ message: 'Review removed' });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  addReview,
  getReviewsByCloth,
  deleteReview,
};
