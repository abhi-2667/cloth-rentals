const mongoose = require('mongoose');

const isNonEmptyString = (value) => typeof value === 'string' && value.trim().length > 0;
const isEmail = (value) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(value || '').trim());
const isValidObjectId = (value) => mongoose.Types.ObjectId.isValid(String(value || ''));

const sendValidationError = (res, message) => {
  return res.status(400).json({ message });
};

const validateRegisterPayload = (req, res, next) => {
  const { name, email, password } = req.body;

  if (!isNonEmptyString(name) || name.trim().length < 2) {
    return sendValidationError(res, 'Name must be at least 2 characters long');
  }

  if (!isEmail(email)) {
    return sendValidationError(res, 'Please provide a valid email address');
  }

  if (!isNonEmptyString(password)) {
    return sendValidationError(res, 'Password is required');
  }

  return next();
};

const validateLoginPayload = (req, res, next) => {
  const { email, password } = req.body;

  if (!isEmail(email)) {
    return sendValidationError(res, 'Please provide a valid email address');
  }

  if (!isNonEmptyString(password)) {
    return sendValidationError(res, 'Password is required');
  }

  return next();
};

const validateBookingPayload = (req, res, next) => {
  const { clothId, startDate, endDate } = req.body;

  if (!isValidObjectId(clothId)) {
    return sendValidationError(res, 'Invalid cloth ID');
  }

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) {
    return sendValidationError(res, 'startDate and endDate must be valid dates');
  }

  return next();
};

const validateClothPayload = (req, res, next) => {
  const { title, description, category, occasion, gender, size, pricePerDay, availability } = req.body;
  const isUpdate = req.method === 'PUT';

  if (!isUpdate || title !== undefined) {
    if (!isNonEmptyString(title)) {
      return sendValidationError(res, 'Title is required');
    }
  }

  if (!isUpdate || description !== undefined) {
    if (!isNonEmptyString(description)) {
      return sendValidationError(res, 'Description is required');
    }
  }

  if (!isUpdate || category !== undefined) {
    if (!['wedding', 'party', 'casual'].includes(String(category || '').toLowerCase())) {
      return sendValidationError(res, 'Category must be wedding, party, or casual');
    }
  }

  const normalizedOccasion = String(occasion || category || '').toLowerCase();
  if (!isUpdate || occasion !== undefined || category !== undefined) {
    if (!['wedding', 'party', 'casual'].includes(normalizedOccasion)) {
      return sendValidationError(res, 'Occasion must be wedding, party, or casual');
    }
  }

  if (gender !== undefined) {
    if (!['women', 'men', 'unisex'].includes(String(gender).toLowerCase())) {
      return sendValidationError(res, 'Gender must be women, men, or unisex');
    }
  }

  if (!isUpdate || size !== undefined) {
    if (!isNonEmptyString(size)) {
      return sendValidationError(res, 'Size is required');
    }
  }

  if (!isUpdate || pricePerDay !== undefined) {
    const price = Number(pricePerDay);
    if (!Number.isFinite(price) || price <= 0) {
      return sendValidationError(res, 'pricePerDay must be a positive number');
    }
  }

  if (availability !== undefined) {
    const normalized = String(availability).toLowerCase();
    if (!['true', 'false'].includes(normalized)) {
      return sendValidationError(res, 'availability must be true or false');
    }
  }

  return next();
};

const validateObjectIdParam = (paramName, label) => (req, res, next) => {
  const value = req.params[paramName];
  if (!isValidObjectId(value)) {
    return sendValidationError(res, `Invalid ${label || paramName}`);
  }
  return next();
};

const validateRolePayload = (req, res, next) => {
  const { role } = req.body;
  if (!['user', 'admin'].includes(role)) {
    return sendValidationError(res, 'Role must be either user or admin');
  }
  return next();
};

const validateApprovalPayload = (req, res, next) => {
  const { approvalStatus } = req.body;
  if (!['approved', 'rejected', 'pending'].includes(approvalStatus)) {
    return sendValidationError(res, 'Approval status must be approved, rejected, or pending');
  }
  return next();
};

const validateProfileUpdatePayload = (req, res, next) => {
  const { name, email, password } = req.body;

  if (name !== undefined && (!isNonEmptyString(name) || name.trim().length < 2)) {
    return sendValidationError(res, 'Name must be at least 2 characters long');
  }

  if (email !== undefined && !isEmail(email)) {
    return sendValidationError(res, 'Please provide a valid email address');
  }

  if (password !== undefined && (!isNonEmptyString(password) || String(password).length < 8)) {
    return sendValidationError(res, 'Password must be at least 8 characters long');
  }

  return next();
};

module.exports = {
  validateRegisterPayload,
  validateLoginPayload,
  validateBookingPayload,
  validateClothPayload,
  validateObjectIdParam,
  validateRolePayload,
  validateApprovalPayload,
  validateProfileUpdatePayload,
};
