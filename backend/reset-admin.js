require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');

const resetAdmin = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const admin = await User.findOne({ where: { email: 'admin@coreqcapital.com' } });

    if (!admin) {
      console.log('Admin user not found. Creating new admin...');
      const hashedPassword = await bcrypt.hash('admin123', 8);
      await User.create({
        name: 'Admin User',
        username: 'admin',
        email: 'admin@coreqcapital.com',
        password: hashedPassword,
        role: 'admin',
        isActive: true
      });
      console.log('✓ Admin user created successfully!');
    } else {
      console.log('Admin user found. Resetting password...');
      const hashedPassword = await bcrypt.hash('admin123', 8);
      await admin.update({
        password: hashedPassword,
        isActive: true
      });
      console.log('✓ Admin password reset successfully!');
    }

    console.log('\nLogin credentials:');
    console.log('Email: admin@coreqcapital.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

resetAdmin();
