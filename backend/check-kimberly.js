require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');
const Borrower = require('./models/Borrower');

const checkKimberly = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    const kimberly = await User.findOne({ where: { email: 'kimberlywanjiku28@gmail.com' } });

    console.log('=== KIMBERLY USER DATA ===');
    console.log('Name:', kimberly.name);
    console.log('Email:', kimberly.email);
    console.log('Role:', kimberly.role);
    console.log('Assigned Location:', kimberly.assignedLocation || 'NOT ASSIGNED');
    console.log('Can Access All Branches:', kimberly.canAccessAllBranches);
    console.log('Branch:', kimberly.branch || 'NOT SET');

    // Check borrower locations
    console.log('\n=== BORROWER LOCATIONS IN DATABASE ===');
    const locations = await Borrower.findAll({
      attributes: ['location'],
      group: ['location']
    });

    const uniqueLocations = [...new Set(locations.map(l => l.location).filter(Boolean))];
    console.log('Unique locations:', uniqueLocations.length > 0 ? uniqueLocations : 'No locations found');

    console.log('\n=== RECOMMENDATION ===');
    if (!kimberly.assignedLocation && !kimberly.canAccessAllBranches) {
      console.log('⚠ Kimberly has NO assigned location and CANNOT access all branches');
      console.log('Solution: Either:');
      console.log('  1. Set canAccessAllBranches = true (she can see all data)');
      console.log('  2. Assign her a specific location that matches borrower data');
    } else if (kimberly.assignedLocation && uniqueLocations.length > 0) {
      if (uniqueLocations.includes(kimberly.assignedLocation)) {
        console.log('✓ Location is properly assigned and matches borrowers');
      } else {
        console.log(`⚠ Assigned location "${kimberly.assignedLocation}" doesn't match any borrower locations`);
        console.log(`Available locations: ${uniqueLocations.join(', ')}`);
      }
    }

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

checkKimberly();
