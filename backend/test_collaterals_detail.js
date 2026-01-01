const axios = require('axios');

async function testCollaterals() {
  try {
    const loginRes = await axios.post('http://localhost:5000/api/auth/login', {
      email: 'admin@coreqcapital.com',
      password: '1234'
    });

    const token = loginRes.data.token;
    const collRes = await axios.get('http://localhost:5000/api/collaterals', {
      headers: { Authorization: `Bearer ${token}` }
    });

    console.log('Total collaterals:', collRes.data.length);

    const withoutBorrower = collRes.data.filter(c => !c.borrower);
    console.log('Collaterals without borrower:', withoutBorrower.length);

    if (withoutBorrower.length > 0) {
      console.log('\nFirst orphaned collateral:');
      console.log(JSON.stringify(withoutBorrower[0], null, 2));
    }

    const withNullCategory = collRes.data.filter(c => !c.category);
    console.log('\nCollaterals with null category:', withNullCategory.length);

    console.log('\nFirst few collaterals:');
    collRes.data.slice(0, 3).forEach((c, i) => {
      console.log(`\n${i + 1}. ${c.itemName}`);
      console.log(`   Borrower: ${c.borrower ? c.borrower.fullName : 'MISSING'}`);
      console.log(`   Category: ${c.category || 'null'}`);
      console.log(`   Condition: ${c.itemCondition}`);
    });
  } catch (e) {
    console.error('Error:', e.response?.data || e.message);
  }
}

testCollaterals();
