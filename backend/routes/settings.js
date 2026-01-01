const express = require('express');
const { getSettings, updateSettings } = require('../controllers/settingsController');
const { auth, adminOnly } = require('../middleware/auth');

const router = express.Router();

router.get('/', auth, adminOnly, getSettings);
router.patch('/', auth, adminOnly, updateSettings);

module.exports = router;