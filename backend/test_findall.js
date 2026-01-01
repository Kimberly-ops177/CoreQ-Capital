require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');

async function testFindAll() {
  try {
    await sequelize.authenticate();
    console.log('Database connected');

    console.log('\nFinding ALL users...');
    const users = await User.findAll();

    console.log(`Found ${users.length} users:`);
    users.forEach(user => {
      console.log({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        isActive: user.isActive
      });
    });

    await sequelize.close();
  } catch (error) {
    console.error('Error:', error);
  }
}

testFindAll();
