require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');

const fixKimberlyAccess = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    const kimberly = await User.findOne({ where: { email: 'kimberlywanjiku28@gmail.com' } });

    if (!kimberly) {
      console.log('❌ Kimberly user not found');
      return;
    }

    console.log('Current settings:');
    console.log('  Assigned Location:', kimberly.assignedLocation);
    console.log('  Can Access All Branches:', kimberly.canAccessAllBranches);

    // Update to give access to all branches
    await kimberly.update({
      canAccessAllBranches: true
    });

    console.log('\n✓ Updated successfully!');
    console.log('  Can Access All Branches: true');
    console.log('\nKimberly can now see all loans, borrowers, and collaterals from all locations.');
    console.log('Please refresh the dashboard to see the changes.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

fixKimberlyAccess();
