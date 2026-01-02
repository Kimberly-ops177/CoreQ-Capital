const express = require('express');
const bcrypt = require('bcryptjs');
const User = require('../models/User');

const router = express.Router();

// One-time admin password reset endpoint
// This should be removed after use for security
router.post('/reset-admin-password-emergency', async (req, res) => {
  try {
    // Security token to prevent unauthorized access
    const { token } = req.body;

    // Only allow this if specific token is provided
    if (token !== 'RESET_ADMIN_2026') {
      return res.status(403).send({ error: 'Invalid token' });
    }

    // New password
    const newPassword = 'Admin@5432';
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update admin password
    const [updatedCount] = await User.update(
      { password: hashedPassword },
      { where: { email: 'admin@coreqcapital.com', role: 'admin' } }
    );

    if (updatedCount > 0) {
      res.send({
        success: true,
        message: 'Admin password updated successfully',
        credentials: {
          email: 'admin@coreqcapital.com',
          password: 'Admin@5432'
        }
      });
    } else {
      res.status(404).send({ error: 'Admin user not found' });
    }

  } catch (error) {
    console.error('Password reset error:', error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
