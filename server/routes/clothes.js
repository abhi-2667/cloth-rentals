const express = require('express');
const router = express.Router();
const path = require('path');
const { getClothes, getClothById, addCloth, updateCloth, deleteCloth } = require('../controllers/clothController');
const { protect, admin, approvedAccount } = require('../middleware/authMiddleware');
const { validateClothPayload, validateObjectIdParam } = require('../middleware/validationMiddleware');

const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'cloth-rental',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp', 'heic']
  }
});
const upload = multer({ storage: storage });

router.route('/')
  .get(getClothes)
  .post(protect, approvedAccount, admin, upload.single('image'), validateClothPayload, addCloth);

router.route('/:id')
  .get(validateObjectIdParam('id', 'cloth ID'), getClothById)
  .put(protect, approvedAccount, admin, validateObjectIdParam('id', 'cloth ID'), upload.single('image'), validateClothPayload, updateCloth)
  .delete(protect, approvedAccount, admin, validateObjectIdParam('id', 'cloth ID'), deleteCloth);

module.exports = router;
