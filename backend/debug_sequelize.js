require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');
const bcrypt = require('bcryptjs');

async function testSequelize() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    console.log('\nFinding user with Sequelize...');
    const user = await User.findOne({
      where: {
        email: 'admin@coreq.com',
        isActive: true
      }
    });

    if (!user) {
      console.log('User not found!');
      return;
    }

    console.log('User found:', {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      isActive: user.isActive
    });

    console.log('\nPassword in DB:', user.password);

    const passwordMatch = await bcrypt.compare('1234', user.password);
    console.log('Password "1234" matches:', passwordMatch);

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testSequelize();
