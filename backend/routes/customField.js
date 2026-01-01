const express = require('express');
const router = express.Router();
const {
  getCustomFields,
  getCustomField,
  createCustomField,
  updateCustomField,
  deleteCustomField
} = require('../controllers/customFieldController');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth);

router.get('/', getCustomFields);
router.get('/:id', getCustomField);
router.post('/', adminOnly, createCustomField);
router.patch('/:id', adminOnly, updateCustomField);
router.delete('/:id', adminOnly, deleteCustomField);

module.exports = router;
