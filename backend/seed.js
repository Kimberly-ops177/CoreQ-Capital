require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');

const createAdmin = async () => {
  try {
    await sequelize.authenticate();
    await sequelize.sync();

    const existingAdmin = await User.findOne({ role: 'admin' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      console.log('Email: admin@coreqcapital.com');
      console.log('Password: admin123');
      return;
    }

    const hashedPassword = await bcrypt.hash('admin123', 8);
    const admin = new User({
      name: 'Admin User',
      email: 'admin@coreqcapital.com',
      password: hashedPassword,
      role: 'admin'
    });

    await admin.save();
    console.log('Admin user created successfully!');
    console.log('Email: admin@coreqcapital.com');
    console.log('Password: admin123');

  } catch (error) {
    console.error('Error creating admin:', error);
  } finally {
    process.exit(0);
  }
};

createAdmin();