require('dotenv').config();
const sequelize = require('./config/database');
const User = require('./models/User');

const updateKimberlyLocations = async () => {
  try {
    await sequelize.authenticate();
    console.log('Database connected\n');

    const kimberly = await User.findOne({ where: { email: 'kimberlywanjiku28@gmail.com' } });

    if (!kimberly) {
      console.log('❌ Kimberly user not found');
      return;
    }

    console.log('Current assigned location:', kimberly.assignedLocation);

    // Update to match database locations (JUJA and HIGHPOINT as found in database)
    await kimberly.update({
      assignedLocation: 'JUJA,HIGHPOINT'  // Changed from "JUJA, HIGHPOINT" to "JUJA,HIGHPOINT"
    });

    console.log('✓ Updated successfully!');
    console.log('New assigned locations: JUJA, HIGHPOINT');
    console.log('\nKimberly can now see all borrowers from JUJA and HIGHPOINT locations.');

  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit(0);
  }
};

updateKimberlyLocations();
