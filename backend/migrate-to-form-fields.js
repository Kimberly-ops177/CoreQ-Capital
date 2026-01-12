/**
 * One-click migration script
 *
 * This script:
 * 1. Creates the form template
 * 2. Backs up the old service
 * 3. Switches to the new service
 *
 * Run: node backend/migrate-to-form-fields.js
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

console.log('╔════════════════════════════════════════════════════════╗');
console.log('║   PDF Form Field Migration - Core Q Capital Loans     ║');
console.log('╚════════════════════════════════════════════════════════╝\n');

async function migrate() {
  try {
    // Step 1: Create form template
    console.log('📝 Step 1: Creating form template...');
    console.log('─────────────────────────────────────────────────────────');

    const createFormScript = path.join(__dirname, 'create-form-template.js');
    if (!fs.existsSync(createFormScript)) {
      throw new Error('create-form-template.js not found');
    }

    // Run the form creation script
    require('./create-form-template.js');

    // Wait a moment for the file to be created
    await new Promise(resolve => setTimeout(resolve, 2000));

    // Verify form template was created
    const formTemplatePath = path.join(__dirname, 'templates/loan_agreement_form_template.pdf');
    if (!fs.existsSync(formTemplatePath)) {
      throw new Error('Form template was not created successfully');
    }

    console.log('\n✅ Form template created successfully!\n');

    // Step 2: Backup old service
    console.log('💾 Step 2: Backing up old service...');
    console.log('─────────────────────────────────────────────────────────');

    const oldServicePath = path.join(__dirname, 'services/loanAgreementService.js');
    const backupPath = path.join(__dirname, 'services/loanAgreementService-coordinate-method-backup.js');

    if (fs.existsSync(oldServicePath)) {
      fs.copyFileSync(oldServicePath, backupPath);
      console.log(`✅ Backup created: ${backupPath}\n`);
    } else {
      console.log('⚠️  No existing service found to backup\n');
    }

    // Step 3: Switch to new service
    console.log('🔄 Step 3: Switching to form field service...');
    console.log('─────────────────────────────────────────────────────────');

    const newServicePath = path.join(__dirname, 'services/loanAgreementService-formfill.js');
    if (!fs.existsSync(newServicePath)) {
      throw new Error('New service file (loanAgreementService-formfill.js) not found');
    }

    // Copy new service to active service
    fs.copyFileSync(newServicePath, oldServicePath);
    console.log('✅ Service switched to form field method!\n');

    // Step 4: Summary
    console.log('╔════════════════════════════════════════════════════════╗');
    console.log('║                  ✅ MIGRATION COMPLETE!                 ║');
    console.log('╚════════════════════════════════════════════════════════╝\n');

    console.log('📋 What was done:');
    console.log('   1. ✅ Created form template with 27 fields');
    console.log('   2. ✅ Backed up old coordinate-based service');
    console.log('   3. ✅ Activated new form field service\n');

    console.log('🧪 Next Steps:');
    console.log('   1. Test locally by creating a new loan');
    console.log('   2. Verify the PDF has no overlapping');
    console.log('   3. If all looks good, deploy:\n');
    console.log('      git add .');
    console.log('      git commit -m "Migrate to form field PDF generation"');
    console.log('      git push origin main\n');

    console.log('🔙 Rollback (if needed):');
    console.log('   cp services/loanAgreementService-coordinate-method-backup.js services/loanAgreementService.js\n');

    console.log('📖 For details, see: FORM-FIELD-MIGRATION-GUIDE.md\n');

  } catch (error) {
    console.error('\n❌ Migration failed:', error.message);
    console.error('\nPlease check the error and try again.');
    console.error('You can also run the steps manually - see FORM-FIELD-MIGRATION-GUIDE.md\n');
    process.exit(1);
  }
}

// Run migration
migrate();
