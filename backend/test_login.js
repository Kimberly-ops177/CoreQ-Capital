const bcrypt = require('bcryptjs');
const mysql = require('mysql2/promise');
require('dotenv').config();

async function testLogin() {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  const [users] = await connection.execute(
    'SELECT * FROM users WHERE email = ?',
    ['admin@coreq.com']
  );

  if (users.length === 0) {
    console.log('No user found with email admin@coreq.com');
    return;
  }

  const user = users[0];
  console.log('User found:', {
    id: user.id,
    name: user.name,
    email: user.email,
    isActive: user.isActive,
    role: user.role
  });

  const passwordMatch = await bcrypt.compare('1234', user.password);
  console.log('Password "1234" matches:', passwordMatch);

  await connection.end();
}

testLogin().catch(console.error);
