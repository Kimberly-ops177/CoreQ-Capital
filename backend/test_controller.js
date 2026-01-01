require('dotenv').config();
const { login } = require('./controllers/authController');

// Mock request and response
const req = {
  body: {
    email: 'admin@coreq.com',
    password: '1234'
  }
};

const res = {
  status: function(code) {
    console.log('Status:', code);
    return this;
  },
  send: function(data) {
    console.log('Response:', JSON.stringify(data, null, 2));
  }
};

console.log('Testing login controller directly...\n');
login(req, res);
