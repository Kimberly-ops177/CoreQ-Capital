require('dotenv').config();
const bcrypt = require('bcryptjs');
const sequelize = require('./config/database');
const User = require('./models/User');

const listUsers = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    const users = await User.findAll({
      attributes: ['id', 'name', 'username', 'email', 'role', 'isActive']
    });

    console.log('=== ALL USERS ===\n');
    users.forEach(u => {
      console.log(`ID: ${u.id}`);
      console.log(`Name: ${u.name}`);
      console.log(`Email: ${u.email}`);
      console.log(`Username: ${u.username || 'N/A'}`);
      console.log(`Role: ${u.role}`);
      console.log(`Active: ${u.isActive}`);
      console.log('---');
    });

    console.log(`\nTotal users: ${users.length}`);

    // Check if Kimberly exists
    const kimberly = users.find(u =>
      u.name.toLowerCase().includes('kimberly') ||
      u.email.toLowerCase().includes('kimberly')
    );

    if (!kimberly) {
      console.log('\n⚠ Kimberly user not found.');
      console.log('Would you like to create Kimberly as an employee? (Run create-kimberly.js)');
    } else {
      console.log('\n✓ Kimberly user found!');
      console.log(`Email: ${kimberly.email}`);
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

listUsers();
