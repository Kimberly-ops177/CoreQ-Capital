require('dotenv').config();
const sequelize = require('./config/database');
const Borrower = require('./models/Borrower');
const { Op } = require('sequelize');

const testQuery = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    // Simulate what the controller does
    const assignedLocation = 'JUJA,HIGHPOINT';
    const locations = assignedLocation.split(',').map(loc => loc.trim());

    console.log('Assigned Location:', assignedLocation);
    console.log('Split into array:', locations);
    console.log('');

    // Test the query
    const whereClause = {
      location: { [Op.in]: locations }
    };

    console.log('Where clause:', JSON.stringify(whereClause, null, 2));
    console.log('');

    const borrowers = await Borrower.findAll({
      where: whereClause,
      attributes: ['id', 'fullName', 'location'],
      limit: 10
    });

    console.log(`Found ${borrowers.length} borrowers:`);
    borrowers.forEach(b => {
      console.log(`  - ${b.fullName} (${b.location})`);
    });

    const total = await Borrower.count({ where: whereClause });
    console.log(`\nTotal borrowers in JUJA or HIGHPOINT: ${total}`);

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

testQuery();
