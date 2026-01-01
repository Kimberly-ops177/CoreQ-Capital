require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');

const resetKimberly = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    const kimberly = await User.findOne({ where: { email: 'kimberlywanjiku28@gmail.com' } });

    if (!kimberly) {
      console.log('❌ Kimberly user not found');
      return;
    }

    console.log('Kimberly user found. Resetting password...');
    const hashedPassword = await bcrypt.hash('kimberly123', 8);
    await kimberly.update({
      password: hashedPassword,
      username: 'kimberly',
      isActive: true
    });

    console.log('✓ Kimberly password reset successfully!\n');
    console.log('Login credentials:');
    console.log('Email: kimberlywanjiku28@gmail.com');
    console.log('Password: kimberly123');
    console.log('Role: employee');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

resetKimberly();
