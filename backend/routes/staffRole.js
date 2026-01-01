const express = require('express');
const router = express.Router();
const {
  getStaffRoles,
  getStaffRole,
  createStaffRole,
  updateStaffRole,
  deleteStaffRole
} = require('../controllers/staffRoleController');
const { auth } = require('../middleware/auth');
const { checkPermission } = require('../middleware/checkPermission');

// All routes require authentication and admin/user management permissions
router.use(auth);

router.get('/', getStaffRoles);
router.get('/:id', getStaffRole);
router.post('/', checkPermission('canAddUsers'), createStaffRole);
router.patch('/:id', checkPermission('canEditUsers'), updateStaffRole);
router.delete('/:id', checkPermission('canDeleteUsers'), deleteStaffRole);

module.exports = router;
