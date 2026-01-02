require('dotenv').config();
const mysql = require('mysql2/promise');

(async () => {
  const connection = await mysql.createConnection({
    host: process.env.DB_HOST || 'localhost',
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    database: process.env.DB_NAME || 'loanmanagement'
  });

  console.log('=== DASHBOARD METRICS BREAKDOWN ===\n');

  // 1. Total Loaned Principal
  const [loans] = await connection.query(`
    SELECT
      SUM(amountIssued) as totalPrincipal,
      COUNT(*) as totalLoans
    FROM loans
    WHERE agreementStatus = 'approved'
  `);
  console.log('1. TOTAL LOANED PRINCIPAL:');
  console.log('   Amount: KSH', parseFloat(loans[0].totalPrincipal || 0).toLocaleString());
  console.log('   Number of approved loans:', loans[0].totalLoans);

  // 2. Outstanding Receivables
  const [outstanding] = await connection.query(`
    SELECT
      id,
      amountIssued,
      totalAmount,
      amountRepaid,
      penalties,
      status
    FROM loans
    WHERE status != 'paid' AND agreementStatus = 'approved'
  `);
  const totalOutstanding = outstanding.reduce((sum, loan) =>
    sum + parseFloat(loan.totalAmount) + parseFloat(loan.penalties || 0), 0
  );
  console.log('\n2. OUTSTANDING RECEIVABLES (unpaid loans):');
  console.log('   Total: KSH', totalOutstanding.toLocaleString());
  console.log('   Number of unpaid loans:', outstanding.length);
  outstanding.forEach(loan => {
    console.log(`   - Loan #${loan.id}: Principal ${loan.amountIssued}, Total ${loan.totalAmount}, Penalties ${loan.penalties || 0}, Status: ${loan.status}`);
  });

  // 3. Active Loans
  const [activeLoans] = await connection.query(`
    SELECT COUNT(*) as count
    FROM loans
    WHERE status = 'active' AND agreementStatus = 'approved'
  `);
  console.log('\n3. ACTIVE LOANS:', activeLoans[0].count);

  // 4. Defaulted Loans
  const [defaultedLoans] = await connection.query(`
    SELECT COUNT(*) as count
    FROM loans
    WHERE status = 'defaulted' AND agreementStatus = 'approved'
  `);
  console.log('4. DEFAULTED LOANS:', defaultedLoans[0].count);

  // 5. Month-to-Date P/L
  const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  const now = new Date();

  const [paidLoans] = await connection.query(`
    SELECT
      id,
      amountIssued,
      totalAmount,
      penalties,
      dateIssued,
      lastPaymentDate
    FROM loans
    WHERE status = 'paid'
      AND agreementStatus = 'approved'
      AND dateIssued >= ?
  `, [monthStart]);

  console.log('\n5. MONTH-TO-DATE P/L CALCULATION:');
  console.log('   Looking for paid loans issued between', monthStart.toISOString().split('T')[0], 'and', now.toISOString().split('T')[0]);
  console.log('   Found', paidLoans.length, 'paid loans issued this month:');

  let totalInterest = 0;
  let totalPenalties = 0;
  paidLoans.forEach(loan => {
    const interest = parseFloat(loan.totalAmount) - parseFloat(loan.amountIssued);
    const penalties = parseFloat(loan.penalties || 0);
    totalInterest += interest;
    totalPenalties += penalties;
    console.log(`   - Loan #${loan.id}: Interest ${interest}, Penalties ${penalties}, Issued: ${loan.dateIssued.toISOString().split('T')[0]}`);
  });

  const totalRevenue = totalInterest + totalPenalties;
  console.log('   Total Interest Earned: KSH', totalInterest.toLocaleString());
  console.log('   Total Penalties Collected: KSH', totalPenalties.toLocaleString());
  console.log('   Total Revenue: KSH', totalRevenue.toLocaleString());

  // 6. Month-to-Date Expenses
  const [expenses] = await connection.query(`
    SELECT
      id,
      amount,
      category,
      date
    FROM expenses
    WHERE date >= ?
  `, [monthStart]);

  const totalExpenses = expenses.reduce((sum, exp) => sum + parseFloat(exp.amount), 0);
  console.log('\n6. MONTH-TO-DATE EXPENSES:');
  console.log('   Total: KSH', totalExpenses.toLocaleString());
  console.log('   Number of expenses:', expenses.length);
  expenses.forEach(exp => {
    const dateStr = new Date(exp.date).toISOString().split('T')[0];
    console.log(`   - ${dateStr}: ${exp.category} - KSH ${parseFloat(exp.amount).toLocaleString()}`);
  });

  console.log('\n7. CALCULATED P/L:');
  console.log('   Revenue: KSH', totalRevenue.toLocaleString());
  console.log('   Expenses: KSH', totalExpenses.toLocaleString());
  console.log('   P/L: KSH', (totalRevenue - totalExpenses).toLocaleString());
  console.log('\n   Note: This should match the dashboard value of KSH 50,500');

  await connection.end();
})();
