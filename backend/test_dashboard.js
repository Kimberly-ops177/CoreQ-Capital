const axios = require('axios');

async function testDashboard() {
  try {
    // Login first
    const loginResponse = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@coreqcapital.com',
      password: '1234'
    });

    const token = loginResponse.data.token;
    console.log('Login successful, token received\n');

    // Test admin dashboard
    const dashboardResponse = await axios.get('http://localhost:5000/api/financial/dashboard/admin', {
      headers: {
        Authorization: `Bearer ${token}`
      }
    });

    console.log('Dashboard data:');
    console.log(JSON.stringify(dashboardResponse.data, null, 2));
  } catch (error) {
    console.error('Error:', error.response?.data || error.message);
  }
}

testDashboard();
