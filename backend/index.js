require('dotenv').config();
const express = require('express');
const cors = require('cors');
const sequelize = require('./config/database');
const authRoutes = require('./routes/auth');
const borrowerRoutes = require('./routes/borrower');
const collateralRoutes = require('./routes/collateral');
const loanRoutes = require('./routes/loan');
const expenseRoutes = require('./routes/expense');
const financialRoutes = require('./routes/financial');
const reportRoutes = require('./routes/report');
const settingsRoutes = require('./routes/settings');
const userRoutes = require('./routes/user');
const staffRoleRoutes = require('./routes/staffRole');
const branchRoutes = require('./routes/branch');
const customFieldRoutes = require('./routes/customField');
const loanAgreementRoutes = require('./routes/loanAgreement');
const loanApplicationRoutes = require('./routes/loanApplication');
const emergencyCleanupRoutes = require('./routes/emergency-cleanup');
const { initializeScheduler } = require('./services/scheduler');
const { initializeNotificationScheduler } = require('./services/loanNotificationScheduler');

// Import models for associations
const User = require('./models/User');
const Borrower = require('./models/Borrower');
const Collateral = require('./models/Collateral');
const Loan = require('./models/Loan');
const Expense = require('./models/Expense');
const Settings = require('./models/Settings');
const StaffRole = require('./models/StaffRole');
const Branch = require('./models/Branch');
const BranchCapital = require('./models/BranchCapital');
const CustomField = require('./models/CustomField');
const UserBranchAccess = require('./models/UserBranchAccess');

const app = express();
const PORT = process.env.PORT || 5000;

// Set up associations
Borrower.hasMany(Collateral, { foreignKey: 'borrowerId', as: 'collaterals' });
Collateral.belongsTo(Borrower, { foreignKey: 'borrowerId', as: 'borrower' });

Borrower.hasMany(Loan, { foreignKey: 'borrowerId', as: 'loans' });
Loan.belongsTo(Borrower, { foreignKey: 'borrowerId', as: 'borrower' });

Collateral.hasMany(Loan, { foreignKey: 'collateralId', as: 'loans' });
Loan.belongsTo(Collateral, { foreignKey: 'collateralId', as: 'collateral' });

User.hasMany(Expense, { foreignKey: 'addedBy', as: 'expenses' });
Expense.belongsTo(User, { foreignKey: 'addedBy', as: 'user' });

StaffRole.hasMany(User, { foreignKey: 'staffRoleId', as: 'users' });
User.belongsTo(StaffRole, { foreignKey: 'staffRoleId', as: 'staffRole' });

// Branch associations
Branch.hasMany(Borrower, { foreignKey: 'branchId', as: 'borrowers' });
Borrower.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

Branch.hasMany(Loan, { foreignKey: 'branchId', as: 'loans' });
Loan.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

Branch.hasMany(Collateral, { foreignKey: 'branchId', as: 'collaterals' });
Collateral.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

Branch.hasMany(BranchCapital, { foreignKey: 'branchId', as: 'capitalTransactions' });
BranchCapital.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

Branch.hasMany(CustomField, { foreignKey: 'branchId', as: 'customFields' });
CustomField.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

Branch.hasMany(User, { foreignKey: 'currentBranchId', as: 'currentUsers' });
User.belongsTo(Branch, { foreignKey: 'currentBranchId', as: 'currentBranch' });

// User branch access associations
User.belongsToMany(Branch, { through: UserBranchAccess, foreignKey: 'userId', as: 'accessibleBranches' });
Branch.belongsToMany(User, { through: UserBranchAccess, foreignKey: 'branchId', as: 'authorizedUsers' });

// Capital added by user
User.hasMany(BranchCapital, { foreignKey: 'addedBy', as: 'capitalTransactions' });
BranchCapital.belongsTo(User, { foreignKey: 'addedBy', as: 'user' });

// Expense-Branch associations
Branch.hasMany(Expense, { foreignKey: 'branchId', as: 'expenses' });
Expense.belongsTo(Branch, { foreignKey: 'branchId', as: 'branch' });

// Connect to database and sync models
async function connectDB() {
  try {
    await sequelize.authenticate();
    console.log('MySQL database connected');

    // Sync all models
    await sequelize.sync({ force: false });
    console.log('Database synchronized');
  } catch (err) {
    console.log('Database connection error:', err);
  }
}

connectDB();

app.use(cors());
app.use(express.json());

// Debug logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.get('/', (req, res) => {
  res.send('API is running');
});

// Basic API health endpoints (prevents "Cannot GET /api" confusion)
app.get('/api', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/borrowers', borrowerRoutes);
app.use('/api/collaterals', collateralRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/expenses', expenseRoutes);
app.use('/api/financial', financialRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/users', userRoutes);
app.use('/api/staff-roles', staffRoleRoutes);
app.use('/api/branches', branchRoutes);
app.use('/api/custom-fields', customFieldRoutes);
app.use('/api/loan-agreements', loanAgreementRoutes);
app.use('/api/loan-applications', loanApplicationRoutes);
app.use('/api/emergency', emergencyCleanupRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);

  // Initialize automated loan processing scheduler
  // This runs daily to:
  // 1. Send due date reminders (1 day before due date)
  // 2. Apply 3% daily penalties during grace period
  // 3. Update loan statuses and flag defaulted loans
  initializeScheduler();

  // Initialize automated notification scheduler
  // This runs daily at 9:00 AM to:
  // 1. Send email & SMS reminders 3 days before due date
  // 2. Send email & SMS reminders on the due date
  // 3. Send email & SMS reminders 1 week past due date
  initializeNotificationScheduler();
});
