require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');

const debugUser = async () => {
  try {
    await sequelize.authenticate();

    const kimberly = await User.findOne({ where: { email: 'kimberlywanjiku28@gmail.com' } });

    console.log('\n=== KIMBERLY USER OBJECT ===');
    console.log('ID:', kimberly.id);
    console.log('Email:', kimberly.email);
    console.log('Role:', kimberly.role);
    console.log('assignedLocation:', kimberly.assignedLocation);
    console.log('Type of assignedLocation:', typeof kimberly.assignedLocation);
    console.log('Is truthy?', !!kimberly.assignedLocation);
    console.log('Is null?', kimberly.assignedLocation === null);
    console.log('Is undefined?', kimberly.assignedLocation === undefined);
    console.log('Is empty string?', kimberly.assignedLocation === '');

    // Test the condition
    const condition = kimberly.role === 'employee' && kimberly.assignedLocation;
    console.log('\nCondition (role === employee && assignedLocation):', condition);

    if (condition) {
      const locations = kimberly.assignedLocation.split(',').map(loc => loc.trim());
      console.log('Split locations:', locations);
    }

    console.log('\n=== FULL USER DATA ===');
    console.log(JSON.stringify(kimberly.toJSON(), null, 2));

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

debugUser();
