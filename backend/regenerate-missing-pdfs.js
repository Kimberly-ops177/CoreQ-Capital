/**
 * Regenerate missing loan agreement PDFs
 * Run this script to fix loans that don't have PDFs generated
 */

require('dotenv').config();
const Loan = require('./models/Loan');
const Borrower = require('./models/Borrower');
const Collateral = require('./models/Collateral');
const { generateLoanAgreementPDF } = require('./services/loanAgreementService');
const sequelize = require('./config/database');
const fs = require('fs');
const path = require('path');

// Set up model associations (same as in index.js)
Borrower.hasMany(Loan, { foreignKey: 'borrowerId', as: 'loans' });
Loan.belongsTo(Borrower, { foreignKey: 'borrowerId', as: 'borrower' });

Collateral.hasMany(Loan, { foreignKey: 'collateralId', as: 'loans' });
Loan.belongsTo(Collateral, { foreignKey: 'collateralId', as: 'collateral' });

async function regenerateMissingPDFs() {
  console.log('🔄 Starting PDF regeneration process...\n');

  try {
    // Connect to database
    await sequelize.authenticate();
    console.log('✓ Connected to database\n');

    // Ensure agreements directory exists
    const agreementsDir = path.join(__dirname, 'agreements');
    if (!fs.existsSync(agreementsDir)) {
      fs.mkdirSync(agreementsDir, { recursive: true });
      console.log('✓ Created agreements directory\n');
    }

    // Find all loans without PDFs or with missing PDF files
    const loans = await Loan.findAll({
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    console.log(`Found ${loans.length} total loans in database\n`);

    const loansNeedingPDFs = loans.filter(loan => {
      // Check if PDF path is missing or file doesn't exist
      const loanIdentifier = loan.loanId || `ID${loan.id}`;
      if (!loan.unsignedAgreementPath) {
        return true;
      }
      if (!fs.existsSync(loan.unsignedAgreementPath)) {
        console.log(`⚠️  Loan #${loanIdentifier}: PDF path exists in DB but file is missing`);
        return true;
      }
      return false;
    });

    console.log(`Found ${loansNeedingPDFs.length} loans needing PDF generation\n`);

    if (loansNeedingPDFs.length === 0) {
      console.log('✅ All loans already have valid PDFs!');
      process.exit(0);
    }

    console.log('Regenerating PDFs...\n');

    let successCount = 0;
    let failCount = 0;

    for (const loan of loansNeedingPDFs) {
      try {
        const loanIdentifier = loan.loanId || `ID${loan.id}`;
        console.log(`Processing Loan #${loanIdentifier} (${loan.borrower?.fullName})...`);

        // Delete old PDF if exists
        if (loan.unsignedAgreementPath && fs.existsSync(loan.unsignedAgreementPath)) {
          fs.unlinkSync(loan.unsignedAgreementPath);
          console.log(`  - Deleted old PDF file`);
        }

        // Generate new PDF
        const result = await generateLoanAgreementPDF(loan, loan.borrower, loan.collateral);

        // Update database with new path
        await loan.update({
          unsignedAgreementPath: result.filepath,
          unsignedAgreementFilename: result.filename
        });

        console.log(`  ✓ PDF generated: ${result.filename}`);
        successCount++;

      } catch (error) {
        const loanIdentifier = loan.loanId || `ID${loan.id}`;
        console.error(`  ❌ Failed to generate PDF for Loan #${loanIdentifier}:`, error.message);
        failCount++;
      }

      console.log('');
    }

    console.log('\n=== REGENERATION SUMMARY ===');
    console.log(`✅ Success: ${successCount} PDFs generated`);
    console.log(`❌ Failed: ${failCount} PDFs`);
    console.log(`📊 Total processed: ${loansNeedingPDFs.length}`);

    if (successCount > 0) {
      console.log('\n🎉 PDFs have been regenerated! You can now print/download loan agreements.');
    }

    process.exit(failCount > 0 ? 1 : 0);

  } catch (error) {
    console.error('❌ Fatal error:', error);
    process.exit(1);
  }
}

// Run the script
regenerateMissingPDFs();
