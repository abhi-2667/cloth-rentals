const express = require('express');
const router = express.Router();
const { registerUser, loginUser } = require('../controllers/authController');
const { validateRegisterPayload, validateLoginPayload } = require('../middleware/validationMiddleware');

router.post('/register', validateRegisterPayload, registerUser);
router.post('/login', validateLoginPayload, loginUser);

module.exports = router;
