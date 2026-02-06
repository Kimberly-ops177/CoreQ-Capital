require('dotenv').config();
const sequelize = require('../config/database');

async function fixDuplicatePayment() {
  try {
    console.log('🔧 Fixing duplicate payment for Loan ID 11...\n');

    // Start transaction
    const transaction = await sequelize.transaction();

    try {
      // Get loan details before fix
      const [loanBefore] = await sequelize.query(
        'SELECT id, amountRepaid, totalAmount FROM loans WHERE id = 11',
        { type: sequelize.QueryTypes.SELECT, transaction }
      );

      if (!loanBefore) {
        console.log('❌ Loan ID 11 not found');
        await transaction.rollback();
        await sequelize.close();
        return;
      }

      console.log('📋 BEFORE FIX:');
      console.log('==============');
      console.log(`Loan.amountRepaid: KSH ${parseFloat(loanBefore.amountRepaid || 0).toLocaleString()}`);

      // Get all payment records for this loan
      const payments = await sequelize.query(
        'SELECT * FROM payments WHERE loanId = 11 ORDER BY id ASC',
        { type: sequelize.QueryTypes.SELECT, transaction }
      );

      console.log(`Payment records found: ${payments.length}\n`);

      if (payments.length !== 2) {
        console.log('⚠️  Expected 2 payment records, found', payments.length);
        console.log('   Aborting to avoid unintended changes.');
        await transaction.rollback();
        await sequelize.close();
        return;
      }

      // Verify both payments are 5760.00
      const payment1 = payments[0];
      const payment2 = payments[1];

      console.log(`Payment #1 (ID ${payment1.id}): KSH ${parseFloat(payment1.amount).toLocaleString()}`);
      console.log(`Payment #2 (ID ${payment2.id}): KSH ${parseFloat(payment2.amount).toLocaleString()}\n`);

      if (Math.abs(parseFloat(payment1.amount) - 5760) > 0.01 ||
          Math.abs(parseFloat(payment2.amount) - 5760) > 0.01) {
        console.log('⚠️  Payment amounts do not match expected value of 5760.00');
        console.log('   Aborting to avoid unintended changes.');
        await transaction.rollback();
        await sequelize.close();
        return;
      }

      // Delete the second duplicate payment (ID 4)
      console.log(`🗑️  Deleting duplicate payment (ID ${payment2.id})...`);
      await sequelize.query(
        'DELETE FROM payments WHERE id = ?',
        { replacements: [payment2.id], transaction }
      );
      console.log('✅ Duplicate payment deleted\n');

      // Update loan's amountRepaid from 11520 to 5760
      const newAmountRepaid = parseFloat(payment1.amount);
      console.log(`🔄 Updating Loan.amountRepaid from ${parseFloat(loanBefore.amountRepaid).toLocaleString()} to ${newAmountRepaid.toLocaleString()}...`);

      await sequelize.query(
        'UPDATE loans SET amountRepaid = ? WHERE id = 11',
        { replacements: [newAmountRepaid], transaction }
      );
      console.log('✅ Loan updated\n');

      // Commit the transaction
      await transaction.commit();

      // Verify the fix
      const [updatedLoan] = await sequelize.query(
        'SELECT id, amountRepaid FROM loans WHERE id = 11',
        { type: sequelize.QueryTypes.SELECT }
      );

      const remainingPayments = await sequelize.query(
        'SELECT * FROM payments WHERE loanId = 11',
        { type: sequelize.QueryTypes.SELECT }
      );

      console.log('📋 AFTER FIX:');
      console.log('=============');
      console.log(`Loan.amountRepaid: KSH ${parseFloat(updatedLoan.amountRepaid || 0).toLocaleString()}`);
      console.log(`Payment records remaining: ${remainingPayments.length}`);
      console.log(`Payment ID ${remainingPayments[0].id}: KSH ${parseFloat(remainingPayments[0].amount).toLocaleString()}\n`);

      console.log('✅ Fix completed successfully!');
      console.log('\nSUMMARY:');
      console.log('========');
      console.log('- Removed 1 duplicate payment record (ID 4)');
      console.log('- Updated Loan.amountRepaid from KSH 11,520 to KSH 5,760');
      console.log('- The loan now correctly reflects the actual payment made\n');

    } catch (error) {
      await transaction.rollback();
      throw error;
    }

    await sequelize.close();
    process.exit(0);

  } catch (error) {
    console.error('❌ Error fixing duplicate payment:', error.message);
    console.error(error);
    await sequelize.close();
    process.exit(1);
  }
}

fixDuplicatePayment();
