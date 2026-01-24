const express = require('express');
const { auth } = require('../middleware/auth');
const Borrower = require('../models/Borrower');
const Collateral = require('../models/Collateral');
const Loan = require('../models/Loan');
const sequelize = require('../config/database');
const { generateLoanAgreementPDF, sendLoanAgreementEmail } = require('../services/loanAgreementService');
const { sendLoanApprovalSMS } = require('../services/smsService');
const { sendEmail } = require('../services/notificationService');
const path = require('path');
const fs = require('fs');

const router = express.Router();

/**
 * Create a complete loan application (Borrower + Collateral + Loan)
 * POST /api/loan-applications
 */
router.post('/', auth, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const { borrower, collateral, loan } = req.body;

    // Validate required data
    if (!borrower || !collateral || !loan) {
      await transaction.rollback();
      return res.status(400).send({
        error: 'Missing required data. Please provide borrower, collateral, and loan details.'
      });
    }

    // 1. Check if borrower exists (for second-time loan benefits)
    let existingBorrower = null;
    let isSecondTimeLoan = false;

    if (borrower.idNumber) {
      existingBorrower = await Borrower.findOne({
        where: { idNumber: borrower.idNumber },
        include: [{
          model: Loan,
          as: 'loans',
          attributes: ['status']
        }]
      });
    }

    // Determine if this is a second-time loan (for negotiable terms)
    if (existingBorrower) {
      const paidLoans = existingBorrower.loans ? existingBorrower.loans.filter(l => l.status === 'paid').length : 0;

      if (paidLoans > 0) {
        isSecondTimeLoan = true;
      }
    }

    // 2. Create or update Borrower
    const newBorrower = existingBorrower
      ? await existingBorrower.update({
          ...borrower,
          totalLoans: (existingBorrower.totalLoans || 0) + 1,
          lastLoanDate: new Date()
        }, { transaction })
      : await Borrower.create({
          ...borrower,
          totalLoans: 1,
          lastLoanDate: new Date()
        }, { transaction });

    // 3. Create Collateral linked to borrower
    const newCollateral = await Collateral.create({
      ...collateral,
      borrowerId: newBorrower.id
    }, { transaction });

    // 4. Get standard interest rates
    const standardRates = {
      1: 20,
      2: 28,
      3: 32,
      4: 35
    };

    const businessRules = {
      minAmountFor4Weeks: 12000,
      negotiableThreshold: 50000
    };

    // 5. Validate loan business rules
    const amount = parseFloat(loan.amountIssued);
    const period = parseInt(loan.loanPeriod);

    if (period === 4 && amount < businessRules.minAmountFor4Weeks) {
      await transaction.rollback();
      return res.status(400).send({
        error: `4-week loans require a minimum of KSH ${businessRules.minAmountFor4Weeks.toLocaleString()}`
      });
    }

    // 6. Determine interest rate - FIXED RATES FOR ALL BORROWERS
    // Policy: Interest rates are non-negotiable for both first-time and returning borrowers
    const interestRate = standardRates[period];

    // Log loan creation info
    if (isSecondTimeLoan) {
      const paidLoansCount = existingBorrower.loans.filter(l => l.status === 'paid').length;
      const tier = paidLoansCount >= 2 ? 'Gold' : 'Silver';

      console.log(`📊 Returning customer loan created:`, {
        borrowerId: newBorrower.id,
        tier: tier,
        fixedRate: `${interestRate}%`,
        paidLoansCount: paidLoansCount
      });
    }

    // 6. Calculate loan totals
    const interestAmount = amount * (interestRate / 100);
    const totalAmount = amount + interestAmount;

    // 7. Calculate due date (add weeks to issue date)
    const dateIssued = new Date(loan.dateIssued);
    const dueDate = new Date(dateIssued);
    dueDate.setDate(dueDate.getDate() + (period * 7));

    // 8. Calculate grace period (3 days after due date)
    const gracePeriodEnd = new Date(dueDate);
    gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

    // 9. Create Loan with pending_upload status
    const newLoan = await Loan.create({
      borrowerId: newBorrower.id,
      collateralId: newCollateral.id,
      amountIssued: amount,
      dateIssued: dateIssued,
      loanPeriod: period,
      interestRate: interestRate,
      dueDate: dueDate,
      status: 'active',
      totalAmount: totalAmount,
      amountRepaid: 0,
      penalties: 0,
      isNegotiable: false, // All loans have fixed, non-negotiable rates
      gracePeriodEnd: gracePeriodEnd,
      branchId: req.user.currentBranchId || null,
      agreementStatus: 'pending_approval', // NEW: Agreement workflow status
      // Track returning customer info in notes for reference
      notes: isSecondTimeLoan
        ? `Returning customer (${existingBorrower.loans.filter(l => l.status === 'paid').length} paid loans). Standard fixed rate applied.`
        : null
    }, { transaction });

    // Commit transaction
    await transaction.commit();

    // 10. Generate PDF agreement
    let pdfPath = null;

    try {
      // Reload loan with associations for PDF generation
      await newLoan.reload({
        include: [
          { model: Borrower, as: 'borrower' },
          { model: Collateral, as: 'collateral' }
        ]
      });

      // Generate PDF
      const result = await generateLoanAgreementPDF(newLoan, newLoan.borrower, newLoan.collateral);
      pdfPath = result.filepath;

      // Save the PDF path to the database
      await newLoan.update({
        unsignedAgreementPath: result.filepath,
        unsignedAgreementFilename: result.filename
      });

      console.log(`Loan agreement PDF generated at ${pdfPath} for loan #${newLoan.id}`);
    } catch (pdfError) {
      console.error('Error generating agreement PDF:', pdfError);
      // Don't fail the whole request if PDF generation fails
    }

    // Return success with all created records
    res.status(201).send({
      success: true,
      message: 'Loan application created successfully. Please download and print the agreement.',
      pdfGenerated: !!pdfPath,
      loan: {
        id: newLoan.id,
        amountIssued: newLoan.amountIssued,
        totalAmount: newLoan.totalAmount,
        interestRate: newLoan.interestRate,
        dueDate: newLoan.dueDate,
        agreementStatus: newLoan.agreementStatus,
        agreementDownloadUrl: `/api/loan-applications/${newLoan.id}/download-agreement`
      },
      borrower: {
        id: newBorrower.id,
        fullName: newBorrower.fullName,
        phoneNumber: newBorrower.phoneNumber,
        email: newBorrower.email
      },
      collateral: {
        id: newCollateral.id,
        itemName: newCollateral.itemName,
        category: newCollateral.category
      },
      calculationDetails: {
        principal: amount,
        interestRate: interestRate,
        interestAmount: interestAmount.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        dueDate: dueDate.toISOString().split('T')[0],
        period: `${period} week(s)`
      }
    });

  } catch (error) {
    await transaction.rollback();
    console.error('Error creating loan application:', error);
    res.status(500).send({
      error: error.message || 'Failed to create loan application'
    });
  }
});

/**
 * Get all loans with pending agreement approvals (admin only)
 * GET /api/loan-applications/pending-approvals
 */
router.get('/pending-approvals', auth, async (req, res) => {
  try {
    const loans = await Loan.findAll({
      where: {
        agreementStatus: 'pending_approval'
      },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ],
      order: [['signedAgreementUploadedAt', 'DESC']]
    });

    res.send(loans);
  } catch (error) {
    console.error('Error fetching pending approvals:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Get all loan agreements with their status
 * GET /api/loan-applications/agreements
 */
router.get('/agreements', auth, async (req, res) => {
  try {
    let whereClause = {};

    // Employees only see agreements for their assigned locations
    if (req.user.role === 'employee' && req.user.assignedLocation) {
      const { Op } = require('sequelize');
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());

      const loans = await Loan.findAll({
        include: [
          {
            model: Borrower,
            as: 'borrower',
            where: { location: { [Op.in]: locations } },
            required: true
          },
          { model: Collateral, as: 'collateral' }
        ],
        order: [['createdAt', 'DESC']]
      });

      return res.send(loans);
    }

    // Admins see all
    const loans = await Loan.findAll({
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ],
      order: [['createdAt', 'DESC']]
    });

    res.send(loans);
  } catch (error) {
    console.error('Error fetching agreements:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Download unsigned loan agreement PDF
 * GET /api/loan-applications/:id/download-agreement
 */
router.get('/:id/download-agreement', auth, async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: Borrower, as: 'borrower' }
      ]
    });

    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    // Check if unsigned agreement path is stored in database
    if (!loan.unsignedAgreementPath) {
      return res.status(404).send({ error: 'Agreement document has not been generated yet' });
    }

    // Verify the file exists
    if (!fs.existsSync(loan.unsignedAgreementPath)) {
      return res.status(404).send({ error: 'Agreement document file not found on server' });
    }

    // Determine file extension from the stored path
    const fileExtension = path.extname(loan.unsignedAgreementPath);
    const downloadFilename = `Loan_Agreement_${loan.id}_${loan.borrower.fullName.replace(/\s+/g, '_')}${fileExtension}`;

    // Use sendFile with proper options for DOCX
    const options = {
      headers: {
        'Content-Type': fileExtension === '.docx'
          ? 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
          : 'application/pdf',
        'Content-Disposition': `attachment; filename="${downloadFilename}"`
      }
    };

    // Send the file
    res.sendFile(loan.unsignedAgreementPath, options, (err) => {
      if (err) {
        console.error('Error sending file:', err);
        if (!res.headersSent) {
          res.status(500).send({ error: 'Failed to send file' });
        }
      }
    });
  } catch (error) {
    console.error('Error downloading agreement:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Approve signed loan agreement (admin only)
 * POST /api/loan-applications/:id/approve
 */
router.post('/:id/approve', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).send({ error: 'Only admins can approve agreements' });
    }

    const loan = await Loan.findByPk(req.params.id, {
      include: [{ model: Borrower, as: 'borrower' }]
    });

    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    if (loan.agreementStatus !== 'pending_approval' && loan.agreementStatus !== 'pending_upload') {
      return res.status(400).send({ error: 'Loan is not pending approval' });
    }

    await loan.update({
      agreementStatus: 'approved',
      agreementApprovedAt: new Date(),
      agreementApprovedBy: req.user.id,
      agreementNotes: req.body.notes || null
    });

    // Send email notification to borrower
    if (loan.borrower.email) {
      try {
        const dueDate = new Date(loan.dueDate).toLocaleDateString('en-KE', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });

        const emailSubject = `Loan Approved - Core Q Capital`;
        const emailHTML = `
          <!DOCTYPE html>
          <html>
          <head>
            <style>
              body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
              .container { max-width: 600px; margin: 0 auto; padding: 20px; }
              .header { background-color: #4CAF50; padding: 20px; text-align: center; color: white; }
              .content { padding: 20px; background-color: #f9f9f9; }
              .amount { font-size: 24px; color: #4CAF50; font-weight: bold; }
              .footer { padding: 20px; text-align: center; font-size: 12px; color: #666; }
              .info { background-color: #E8F5E9; padding: 15px; border-left: 4px solid #4CAF50; margin: 15px 0; }
            </style>
          </head>
          <body>
            <div class="container">
              <div class="header">
                <h1>🎉 Loan Approved!</h1>
              </div>
              <div class="content">
                <h2>Congratulations ${loan.borrower.fullName}!</h2>
                <p>Your loan application has been approved by Core Q Capital.</p>

                <div class="info">
                  <h3>Loan Details:</h3>
                  <ul>
                    <li><strong>Loan Amount:</strong> KSH ${parseFloat(loan.amountIssued).toLocaleString()}</li>
                    <li><strong>Total Amount Due:</strong> <span class="amount">KSH ${parseFloat(loan.totalAmount).toLocaleString()}</span></li>
                    <li><strong>Interest Rate:</strong> ${loan.interestRate}%</li>
                    <li><strong>Loan Period:</strong> ${loan.loanPeriod} week(s)</li>
                    <li><strong>Due Date:</strong> ${dueDate}</li>
                  </ul>
                </div>

                <h3>Payment Instructions:</h3>
                <p>When making repayments, use these details:</p>
                <ul>
                  <li><strong>Paybill Number:</strong> 522533</li>
                  <li><strong>Account Number:</strong> 7862638</li>
                </ul>

                <p>Please ensure payment is made on or before the due date to avoid penalties.</p>

                <p>For any inquiries or assistance, feel free to contact us at <strong>0797637074</strong> / <a href="mailto:coreqcapital@gmail.com">coreqcapital@gmail.com</a>.</p>

                <p>Thank you for choosing Core Q Capital. We appreciate your continued partnership.</p>

                <p>Kind regards,<br>
                <strong>Core Q Capital</strong><br>
                0797637074</p>
              </div>
              <div class="footer">
                Core Q Capital | 0797637074 | coreqcapital@gmail.com
              </div>
            </div>
          </body>
          </html>
        `;

        const emailResult = await sendEmail(loan.borrower.email, emailSubject, emailHTML);
        if (emailResult.success) {
          console.log(`✅ Loan approval email sent to ${loan.borrower.email}`);
        } else {
          console.error(`⚠️ Failed to send loan approval email: ${emailResult.error}`);
        }
      } catch (emailError) {
        console.error('⚠️ Failed to send loan approval email:', emailError);
        // Don't fail the approval if email fails
      }
    }

    // Send SMS notification to borrower (will be skipped if no SMS configured)
    try {
      await sendLoanApprovalSMS(loan.borrower, loan);
      console.log(`✅ Loan approval SMS sent to ${loan.borrower.phoneNumber}`);
    } catch (smsError) {
      console.error('⚠️ Failed to send loan approval SMS:', smsError);
      // Don't fail the approval if SMS fails
    }

    res.send({
      success: true,
      message: `Loan agreement #${loan.id} approved successfully`,
      loan: {
        id: loan.id,
        agreementStatus: loan.agreementStatus,
        approvedAt: loan.agreementApprovedAt
      }
    });
  } catch (error) {
    console.error('Error approving agreement:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Reject signed loan agreement (admin only)
 * POST /api/loan-applications/:id/reject
 */
router.post('/:id/reject', auth, async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      return res.status(403).send({ error: 'Only admins can reject agreements' });
    }

    const loan = await Loan.findByPk(req.params.id, {
      include: [{ model: Borrower, as: 'borrower' }]
    });

    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    if (loan.agreementStatus !== 'pending_approval' && loan.agreementStatus !== 'pending_upload') {
      return res.status(400).send({ error: 'Loan is not pending approval' });
    }

    await loan.update({
      agreementStatus: 'rejected',
      agreementRejectedAt: new Date(),
      agreementRejectedBy: req.user.id,
      agreementNotes: req.body.notes || 'Agreement rejected'
    });

    res.send({
      success: true,
      message: `Loan agreement #${loan.id} rejected`,
      loan: {
        id: loan.id,
        agreementStatus: loan.agreementStatus,
        rejectedAt: loan.agreementRejectedAt,
        notes: loan.agreementNotes
      }
    });
  } catch (error) {
    console.error('Error rejecting agreement:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Delete a loan application (only if status is pending_approval)
 * DELETE /api/loan-applications/:id
 */
router.delete('/:id', auth, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    if (!loan) {
      await transaction.rollback();
      return res.status(404).send({ error: 'Loan not found' });
    }

    // Only allow deletion if agreement status is pending_approval (not yet approved/rejected)
    if (loan.agreementStatus !== 'pending_approval') {
      await transaction.rollback();
      return res.status(400).send({
        error: 'Can only delete loans that are pending approval (not yet approved or rejected)'
      });
    }

    // Check permissions for employees
    if (req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      if (!locations.includes(loan.borrower.location)) {
        await transaction.rollback();
        return res.status(403).send({
          error: 'You do not have permission to delete this loan'
        });
      }
    }

    // Delete the unsigned agreement PDF if it exists
    if (loan.unsignedAgreementPath && fs.existsSync(loan.unsignedAgreementPath)) {
      fs.unlinkSync(loan.unsignedAgreementPath);
    }

    // Store IDs before deletion
    const borrowerId = loan.borrowerId;
    const collateralId = loan.collateralId;

    // Delete the loan
    await loan.destroy({ transaction });

    // Delete associated collateral
    if (collateralId) {
      await Collateral.destroy({ where: { id: collateralId }, transaction });
    }

    // Delete associated borrower
    if (borrowerId) {
      await Borrower.destroy({ where: { id: borrowerId }, transaction });
    }

    await transaction.commit();

    res.send({
      success: true,
      message: `Loan #${req.params.id} and associated records deleted successfully`
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error deleting loan application:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Update loan application details (only if status is pending_approval)
 * PUT /api/loan-applications/:id
 */
router.put('/:id', auth, async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    if (!loan) {
      await transaction.rollback();
      return res.status(404).send({ error: 'Loan not found' });
    }

    // Only allow updates if agreement status is pending_approval (not yet approved/rejected)
    if (loan.agreementStatus !== 'pending_approval') {
      await transaction.rollback();
      return res.status(400).send({
        error: 'Can only edit loans that are pending approval (not yet approved or rejected)'
      });
    }

    // Check permissions for employees
    if (req.user.role === 'employee' && req.user.assignedLocation) {
      const locations = req.user.assignedLocation.split(',').map(loc => loc.trim());
      if (!locations.includes(loan.borrower.location)) {
        await transaction.rollback();
        return res.status(403).send({
          error: 'You do not have permission to edit this loan'
        });
      }
    }

    const { borrower, collateral, loan: loanData } = req.body;

    // Update borrower if data provided
    if (borrower && loan.borrower) {
      await loan.borrower.update(borrower, { transaction });
    }

    // Update collateral if data provided
    if (collateral && loan.collateral) {
      await loan.collateral.update(collateral, { transaction });
    }

    // Update loan if data provided
    if (loanData) {
      const amount = parseFloat(loanData.amountIssued) || loan.amountIssued;
      const period = parseInt(loanData.loanPeriod) || loan.loanPeriod;

      // Recalculate if amount or period changed
      const standardRates = { 1: 20, 2: 28, 3: 32, 4: 35 };
      const businessRules = { minAmountFor4Weeks: 12000, negotiableThreshold: 50000 };

      let interestRate;
      if (amount > businessRules.negotiableThreshold) {
        interestRate = parseFloat(loanData.interestRate) || loan.interestRate;
      } else {
        interestRate = standardRates[period];
      }

      const interestAmount = amount * (interestRate / 100);
      const totalAmount = amount + interestAmount;

      const dateIssued = loanData.dateIssued ? new Date(loanData.dateIssued) : loan.dateIssued;
      const dueDate = new Date(dateIssued);
      dueDate.setDate(dueDate.getDate() + (period * 7));

      const gracePeriodEnd = new Date(dueDate);
      gracePeriodEnd.setDate(gracePeriodEnd.getDate() + 3);

      await loan.update({
        amountIssued: amount,
        dateIssued: dateIssued,
        loanPeriod: period,
        interestRate: interestRate,
        dueDate: dueDate,
        totalAmount: totalAmount,
        gracePeriodEnd: gracePeriodEnd,
        isNegotiable: amount > businessRules.negotiableThreshold
      }, { transaction });
    }

    await transaction.commit();

    // Regenerate PDF with updated data
    try {
      await loan.reload({
        include: [
          { model: Borrower, as: 'borrower' },
          { model: Collateral, as: 'collateral' }
        ]
      });

      // Delete old PDF if exists
      if (loan.unsignedAgreementPath && fs.existsSync(loan.unsignedAgreementPath)) {
        fs.unlinkSync(loan.unsignedAgreementPath);
      }

      // Generate new PDF
      const result = await generateLoanAgreementPDF(loan, loan.borrower, loan.collateral);
      await loan.update({
        unsignedAgreementPath: result.filepath,
        unsignedAgreementFilename: result.filename
      });
    } catch (pdfError) {
      console.error('Error regenerating PDF:', pdfError);
    }

    res.send({
      success: true,
      message: 'Loan application updated successfully',
      loan: loan
    });
  } catch (error) {
    await transaction.rollback();
    console.error('Error updating loan application:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Check if borrower qualifies for second-time loan benefits
 * GET /api/loan-applications/check-borrower/:idNumber
 */
router.get('/check-borrower/:idNumber', auth, async (req, res) => {
  try {
    const { idNumber } = req.params;

    // Find borrower by ID number
    const borrower = await Borrower.findOne({
      where: { idNumber },
      include: [{
        model: Loan,
        as: 'loans',
        attributes: ['id', 'status', 'dateIssued', 'dueDate', 'amountIssued', 'totalAmount', 'amountRepaid']
      }]
    });

    if (!borrower) {
      return res.send({
        exists: false,
        isSecondTimeBorrower: false,
        message: 'New borrower'
      });
    }

    // Count completed loans (paid status)
    const paidLoans = borrower.loans ? borrower.loans.filter(loan => loan.status === 'paid').length : 0;
    const defaultedLoans = borrower.loans ? borrower.loans.filter(loan => loan.status === 'defaulted').length : 0;
    const totalLoans = borrower.loans ? borrower.loans.length : 0;

    // Determine customer tier
    let tier = 'new';

    if (defaultedLoans > 0) {
      tier = 'at-risk';
    } else if (paidLoans >= 2) {
      tier = 'gold'; // Valued Customer
    } else if (paidLoans === 1) {
      tier = 'silver'; // Returning Customer
    }

    const isSecondTimeBorrower = paidLoans > 0;

    res.send({
      exists: true,
      isSecondTimeBorrower,
      borrower: {
        id: borrower.id,
        fullName: borrower.fullName,
        phoneNumber: borrower.phoneNumber,
        email: borrower.email,
        location: borrower.location,
        apartment: borrower.apartment,
        houseNumber: borrower.houseNumber,
        isStudent: borrower.isStudent,
        institution: borrower.institution,
        registrationNumber: borrower.registrationNumber,
        emergencyNumber: borrower.emergencyNumber
      },
      loanHistory: {
        totalLoans,
        loansRepaid: paidLoans,
        loansDefaulted: defaultedLoans,
        tier
      },
      benefits: {
        // Note: All borrowers receive the same fixed, non-negotiable interest rates
        negotiableRates: false,
        negotiablePeriod: false
      }
    });

  } catch (error) {
    console.error('Error checking borrower:', error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
