const axios = require('axios');

async function testCollaterals() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@coreqcapital.com',
      password: '1234'
    });

    const token = loginResponse.data.token;
    console.log('Login successful\n');

    // Test collaterals endpoint
    const collateralsResponse = await axios.get('http://localhost:5000/api/collaterals', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log(`Found ${collateralsResponse.data.length} collaterals`);

    if (collateralsResponse.data.length > 0) {
      console.log('\nFirst collateral:');
      console.log(JSON.stringify(collateralsResponse.data[0], null, 2));
    }
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
    if (error.response?.data) {
      console.error('Full error:', error.response.data);
    }
  }
}

testCollaterals();
