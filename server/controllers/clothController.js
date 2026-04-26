const Cloth = require('../models/Cloth');
const Booking = require('../models/Booking');
const devStore = require('../utils/devStore');

const useDevStore = !process.env.MONGO_URI;

const getClothes = async (req, res) => {
  try {
    if (useDevStore) {
      return res.json(devStore.listClothes(req.query));
    }

    const { category, occasion, gender, availability, size, minPrice, maxPrice, startDate, endDate, search } = req.query;
    let query = {};

    const normalizedOccasion = String(occasion || category || '').toLowerCase();
    if (normalizedOccasion) {
      query.$or = [{ occasion: normalizedOccasion }, { category: normalizedOccasion }];
    }
    if (gender) query.gender = String(gender).toLowerCase();
    if (availability === 'true') query.availability = true;
    if (availability === 'false') query.availability = false;
    if (size) query.size = { $regex: size, $options: 'i' };
    if (minPrice || maxPrice) {
      query.pricePerDay = {};
      if (minPrice) query.pricePerDay.$gte = Number(minPrice);
      if (maxPrice) query.pricePerDay.$lte = Number(maxPrice);
    }
    if (search) {
      const escaped = String(search).replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      const searchRegex = { $regex: escaped, $options: 'i' };
      const searchConditions = [
        { title: searchRegex },
        { description: searchRegex },
        { category: searchRegex },
        { occasion: searchRegex },
        { size: searchRegex },
      ];
      // Merge with existing $or if present, otherwise set directly
      if (query.$or) {
        query.$and = [{ $or: query.$or }, { $or: searchConditions }];
        delete query.$or;
      } else {
        query.$or = searchConditions;
      }
    }

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);

      if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start >= end) {
        return res.status(400).json({ message: 'Invalid date range for availability filter' });
      }

      const overlappingBookings = await Booking.find({
        status: 'booked',
        $and: [
          { startDate: { $lte: end } },
          { endDate: { $gte: start } }
        ]
      }).select('clothId');

      const unavailableClothIds = overlappingBookings.map((booking) => booking.clothId);
      query._id = { $nin: unavailableClothIds };
    }

    const clothes = await Cloth.find(query);
    res.json(clothes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const getClothById = async (req, res) => {
  try {
    if (useDevStore) {
      const cloth = devStore.getClothById(req.params.id);
      if (!cloth) return res.status(404).json({ message: 'Cloth not found' });
      return res.json(cloth);
    }

    const cloth = await Cloth.findById(req.params.id);
    if (!cloth) return res.status(404).json({ message: 'Cloth not found' });
    res.json(cloth);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const addCloth = async (req, res) => {
  try {
    const { title, description, category, occasion, gender, size, pricePerDay } = req.body;
    let imageUrl = '';

    if (req.file) {
      imageUrl = req.file.path;
    } else if (req.body.imageUrl) {
      imageUrl = req.body.imageUrl;
    } else {
      return res.status(400).json({ message: 'Image is required' });
    }

    if (useDevStore) {
      const cloth = devStore.addCloth({
        title,
        description,
        category,
        occasion: occasion || category,
        gender: gender || 'unisex',
        size,
        pricePerDay,
        imageUrl,
        availability: true,
      });

      return res.status(201).json(cloth);
    }

    const cloth = await Cloth.create({
      title,
      description,
      category,
      occasion: occasion || category,
      gender: gender || 'unisex',
      size,
      pricePerDay,
      imageUrl
    });

    res.status(201).json(cloth);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const updateCloth = async (req, res) => {
  try {
    const { title, description, category, occasion, gender, size, pricePerDay, availability } = req.body;
    
    // Only update fields that are actually provided (not undefined)
    let updateFields = {};
    
    if (title !== undefined) updateFields.title = title;
    if (description !== undefined) updateFields.description = description;
    if (category !== undefined) updateFields.category = category;
    if (occasion !== undefined) updateFields.occasion = occasion;
    else if (category !== undefined) updateFields.occasion = category; // Use category as occasion if not specified
    if (gender !== undefined) updateFields.gender = gender;
    if (size !== undefined) updateFields.size = size;
    if (pricePerDay !== undefined) updateFields.pricePerDay = pricePerDay;
    if (availability !== undefined) updateFields.availability = availability;
    
    if (req.file) {
      updateFields.imageUrl = req.file.path;
    }

    if (useDevStore) {
      const cloth = devStore.updateCloth(req.params.id, updateFields);
      if (!cloth) return res.status(404).json({ message: 'Cloth not found' });
      return res.json(cloth);
    }

    const cloth = await Cloth.findByIdAndUpdate(req.params.id, updateFields, { new: true });
    
    if (!cloth) return res.status(404).json({ message: 'Cloth not found' });
    res.json(cloth);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

const deleteCloth = async (req, res) => {
  try {
    if (useDevStore) {
      const cloth = devStore.deleteCloth(req.params.id);
      if (!cloth) return res.status(404).json({ message: 'Cloth not found' });
      return res.json({ message: 'Cloth removed' });
    }

    const cloth = await Cloth.findByIdAndDelete(req.params.id);
    if (!cloth) return res.status(404).json({ message: 'Cloth not found' });
    res.json({ message: 'Cloth removed' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { getClothes, getClothById, addCloth, updateCloth, deleteCloth };
