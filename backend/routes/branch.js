const express = require('express');
const router = express.Router();
const {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  addCapital,
  getCapitalHistory,
  grantBranchAccess,
  revokeBranchAccess,
  getUserBranchAccess
} = require('../controllers/branchController');
const { auth, adminOnly } = require('../middleware/auth');

router.use(auth);

// Branch CRUD (admin only)
router.get('/', getBranches);
router.get('/:id', getBranch);
router.post('/', adminOnly, createBranch);
router.patch('/:id', adminOnly, updateBranch);
router.delete('/:id', adminOnly, deleteBranch);

// Capital management (admin only)
router.post('/capital', adminOnly, addCapital);
router.get('/:branchId/capital', getCapitalHistory);

// User branch access (admin only)
router.post('/access/grant', adminOnly, grantBranchAccess);
router.post('/access/revoke', adminOnly, revokeBranchAccess);
router.get('/access/user/:userId', getUserBranchAccess);

module.exports = router;
