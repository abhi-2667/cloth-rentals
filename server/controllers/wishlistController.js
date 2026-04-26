const Wishlist = require('../models/Wishlist');
const Cloth = require('../models/Cloth');
const devStore = require('../utils/devStore');

const useDevStore = !process.env.MONGO_URI;

const getWishlist = async (req, res) => {
  try {
    if (useDevStore) {
      return res.json(devStore.listWishlistItems(req.user.id));
    }

    const items = await Wishlist.find({ userId: req.user.id }).populate('clothId');
    return res.json(items);
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

const toggleWishlist = async (req, res) => {
  try {
    const { clothId } = req.body;

    if (!clothId) {
      return res.status(400).json({ message: 'clothId is required' });
    }

    if (useDevStore) {
      const cloth = devStore.getClothById(clothId);
      if (!cloth) {
        return res.status(404).json({ message: 'Cloth not found' });
      }

      const existing = devStore.getWishlistItem({ userId: req.user.id, clothId });
      if (existing) {
        devStore.removeWishlistItem({ userId: req.user.id, clothId });
        return res.json({ message: 'Removed from wishlist', inWishlist: false });
      }

      devStore.addWishlistItem({ userId: req.user.id, clothId });
      return res.json({ message: 'Added to wishlist', inWishlist: true });
    }

    const cloth = await Cloth.findById(clothId);
    if (!cloth) {
      return res.status(404).json({ message: 'Cloth not found' });
    }

    const existing = await Wishlist.findOne({ userId: req.user.id, clothId });
    if (existing) {
      await Wishlist.deleteOne({ _id: existing._id });
      return res.json({ message: 'Removed from wishlist', inWishlist: false });
    }

    await Wishlist.create({ userId: req.user.id, clothId });
    return res.json({ message: 'Added to wishlist', inWishlist: true });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getWishlist,
  toggleWishlist,
};
