const express = require('express');
const { register, login, getProfile, updateProfile } = require('../controllers/authController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.post('/register', auth, adminOnly, register);
router.post('/login', login);
router.get('/profile', auth, getProfile);
router.patch('/profile', auth, updateProfile);

module.exports = router;