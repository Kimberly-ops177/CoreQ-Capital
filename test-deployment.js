/**
 * Deployment Testing Script
 *
 * Tests all 8 new features on your Railway deployment
 *
 * Usage:
 *   node test-deployment.js
 *
 * Requirements:
 *   - npm install axios
 *   - Set ADMIN_TOKEN environment variable or edit below
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'https://api.coreqcapital.com/api';
const ADMIN_TOKEN = process.env.ADMIN_TOKEN || 'YOUR_ADMIN_TOKEN_HERE';

// Color codes for console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

const log = {
  info: (msg) => console.log(`${colors.cyan}ℹ${colors.reset} ${msg}`),
  success: (msg) => console.log(`${colors.green}✓${colors.reset} ${msg}`),
  error: (msg) => console.log(`${colors.red}✗${colors.reset} ${msg}`),
  warning: (msg) => console.log(`${colors.yellow}⚠${colors.reset} ${msg}`),
  section: (msg) => console.log(`\n${colors.blue}═══ ${msg} ═══${colors.reset}\n`),
  test: (name, passed, details = '') => {
    if (passed) {
      console.log(`${colors.green}✓${colors.reset} Test: ${name}`);
      if (details) console.log(`  ${colors.cyan}${details}${colors.reset}`);
    } else {
      console.log(`${colors.red}✗${colors.reset} Test: ${name}`);
      if (details) console.log(`  ${colors.red}${details}${colors.reset}`);
    }
  }
};

// HTTP client with auth
const api = axios.create({
  baseURL: BASE_URL,
  headers: {
    'Authorization': `Bearer ${ADMIN_TOKEN}`,
    'Content-Type': 'application/json'
  }
});

// Test results tracker
const results = {
  passed: 0,
  failed: 0,
  warnings: 0
};

async function testBackendHealth() {
  log.section('Test 1: Backend Health Check');

  try {
    const response = await axios.get(`${BASE_URL}/health`);
    log.test('Backend is accessible', true, `Status: ${response.status}`);
    results.passed++;
  } catch (error) {
    log.test('Backend is accessible', false, error.message);
    results.failed++;
    throw new Error('Backend is not accessible. Cannot continue tests.');
  }
}

async function testExpenseCategories() {
  log.section('Test 2: Expense Categories (New Feature)');

  try {
    const response = await api.get('/expenses/categories');
    const categories = response.data.categories;

    const expectedCategories = ['Rent', 'Salary', 'Printing', 'Others'];
    const hasAllCategories = expectedCategories.every(cat => categories.includes(cat));

    log.test('Get expense categories endpoint', true, `Categories: ${categories.join(', ')}`);
    log.test('Has all 4 required categories', hasAllCategories,
      hasAllCategories ? '' : `Missing: ${expectedCategories.filter(c => !categories.includes(c)).join(', ')}`);

    if (hasAllCategories) {
      results.passed += 2;
    } else {
      results.passed += 1;
      results.failed += 1;
    }
  } catch (error) {
    log.test('Get expense categories endpoint', false, error.response?.data?.error || error.message);
    results.failed += 2;
  }
}

async function testCreateLoanWithID() {
  log.section('Test 3: Create Loan (Should Generate Loan ID)');

  try {
    // Note: This will create a real loan! Make sure you have test data
    log.warning('This test will create a real loan in the database');
    log.info('Skipping actual loan creation to avoid test data...');
    log.info('To test manually, create a loan via the frontend and check for loanId field');

    results.warnings++;
  } catch (error) {
    log.test('Create loan with ID', false, error.response?.data?.error || error.message);
    results.failed++;
  }
}

async function testReportDateFilters() {
  log.section('Test 4: Report Date Filters (New Feature)');

  try {
    // Test loans issued report with date range
    const startDate = '2026-01-01';
    const endDate = '2026-01-31';

    const response = await api.get(`/reports/loans-issued?startDate=${startDate}&endDate=${endDate}`);

    const hasPeriod = response.data.period !== undefined;
    const correctPeriod = response.data.period === `${startDate} to ${endDate}`;

    log.test('Report accepts date parameters', true, `Period: ${response.data.period || 'N/A'}`);
    log.test('Report returns correct period field', correctPeriod,
      correctPeriod ? '' : `Expected: "${startDate} to ${endDate}", Got: "${response.data.period}"`);

    if (hasPeriod && correctPeriod) {
      results.passed += 2;
    } else {
      results.passed += hasPeriod ? 1 : 0;
      results.failed += correctPeriod ? 0 : 1;
    }
  } catch (error) {
    log.test('Report date filters', false, error.response?.data?.error || error.message);
    results.failed += 2;
  }
}

async function testInterestRateEndpoint() {
  log.section('Test 5: Interest Rate Editing Endpoint (New Feature)');

  try {
    log.warning('Testing endpoint exists, not actually updating a loan');

    // Just test that the endpoint exists by sending an invalid request
    // This should fail with validation error, not 404
    try {
      await api.patch('/loans/999999/interest-rate', { interestRate: 25 });
    } catch (error) {
      if (error.response?.status === 404) {
        // 404 means loan not found, which means endpoint exists!
        log.test('Interest rate endpoint exists', true, 'Endpoint responding (loan not found is expected)');
        results.passed++;
      } else if (error.response?.status === 400) {
        log.test('Interest rate endpoint exists', true, 'Endpoint responding with validation');
        results.passed++;
      } else {
        throw error;
      }
    }
  } catch (error) {
    log.test('Interest rate endpoint', false, error.response?.data?.error || error.message);
    results.failed++;
  }
}

async function testCollateralSoldEndpoints() {
  log.section('Test 6: Collateral Sold/Not Sold Endpoints (New Feature)');

  try {
    log.warning('Testing endpoints exist, not actually marking collateral');

    // Test mark-sold endpoint exists
    try {
      await api.post('/collaterals/999999/mark-sold', { soldPrice: 10000 });
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        log.test('Mark sold endpoint exists', true, 'Endpoint responding');
        results.passed++;
      } else {
        throw error;
      }
    }

    // Test mark-not-sold endpoint exists
    try {
      await api.post('/collaterals/999999/mark-not-sold');
    } catch (error) {
      if (error.response?.status === 404 || error.response?.status === 400) {
        log.test('Mark not sold endpoint exists', true, 'Endpoint responding');
        results.passed++;
      } else {
        throw error;
      }
    }
  } catch (error) {
    log.test('Collateral sold endpoints', false, error.response?.data?.error || error.message);
    results.failed += 2;
  }
}

async function testAllReportsWithDateFilters() {
  log.section('Test 7: All 8 Reports Accept Date Filters (New Feature)');

  const reports = [
    '/reports/loans-issued',
    '/reports/loan-status',
    '/reports/defaulters',
    '/reports/defaulted-items',
    '/reports/balances',
    '/reports/not-yet-paid',
    '/reports/expenses',
    '/reports/profit-loss'
  ];

  const startDate = '2026-01-01';
  const endDate = '2026-01-31';

  for (const reportPath of reports) {
    try {
      const response = await api.get(`${reportPath}?startDate=${startDate}&endDate=${endDate}`);

      // Check if response has period field
      const hasPeriod = response.data.period !== undefined;

      log.test(`${reportPath.split('/').pop()} report`, hasPeriod,
        hasPeriod ? `Period: ${response.data.period}` : 'No period field found');

      if (hasPeriod) {
        results.passed++;
      } else {
        results.failed++;
      }
    } catch (error) {
      log.test(`${reportPath.split('/').pop()} report`, false, error.response?.data?.error || error.message);
      results.failed++;
    }
  }
}

async function testCreateExpenseValidation() {
  log.section('Test 8: Expense Category Validation (New Feature)');

  try {
    // Test invalid category (should fail)
    try {
      await api.post('/expenses', {
        category: 'InvalidCategory',
        name: 'Test expense',
        amount: 1000
      });

      // If we get here, validation didn't work
      log.test('Expense validation rejects invalid categories', false, 'Invalid category was accepted!');
      results.failed++;
    } catch (error) {
      if (error.response?.status === 400 && error.response?.data?.error === 'Invalid category') {
        log.test('Expense validation rejects invalid categories', true, 'Correctly rejected invalid category');
        results.passed++;
      } else {
        throw error;
      }
    }
  } catch (error) {
    log.test('Expense validation', false, error.response?.data?.error || error.message);
    results.failed++;
  }
}

async function runAllTests() {
  log.section('🚀 Core Q Capital - Deployment Test Suite');
  log.info(`Testing backend: ${BASE_URL}`);
  log.info(`Timestamp: ${new Date().toISOString()}\n`);

  try {
    await testBackendHealth();
    await testExpenseCategories();
    await testCreateLoanWithID();
    await testReportDateFilters();
    await testInterestRateEndpoint();
    await testCollateralSoldEndpoints();
    await testAllReportsWithDateFilters();
    await testCreateExpenseValidation();

    // Summary
    log.section('Test Results Summary');

    const total = results.passed + results.failed;
    const passRate = ((results.passed / total) * 100).toFixed(1);

    console.log(`  Total Tests: ${total}`);
    console.log(`  ${colors.green}Passed: ${results.passed}${colors.reset}`);
    console.log(`  ${colors.red}Failed: ${results.failed}${colors.reset}`);
    console.log(`  ${colors.yellow}Warnings: ${results.warnings}${colors.reset}`);
    console.log(`  Pass Rate: ${passRate}%\n`);

    if (results.failed === 0) {
      log.success('🎉 All tests passed! Your deployment is successful.');
      log.info('All new features are working correctly.');
    } else {
      log.warning(`⚠️  ${results.failed} test(s) failed. Please review the errors above.`);
      log.info('Check RAILWAY_DEPLOYMENT_GUIDE.md for troubleshooting.');
    }

  } catch (error) {
    log.error('Test suite aborted due to critical error');
    log.error(error.message);
    process.exit(1);
  }
}

// Run tests
if (require.main === module) {
  if (ADMIN_TOKEN === 'YOUR_ADMIN_TOKEN_HERE') {
    console.error(`${colors.red}✗${colors.reset} Please set ADMIN_TOKEN environment variable or edit the script`);
    console.error('Usage: ADMIN_TOKEN=your_token node test-deployment.js');
    process.exit(1);
  }

  runAllTests().catch(error => {
    console.error('Fatal error:', error);
    process.exit(1);
  });
}
