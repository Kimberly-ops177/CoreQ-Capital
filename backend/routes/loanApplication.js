const express = require('express');
const { auth } = require('../middleware/auth');
const Borrower = require('../models/Borrower');
const Collateral = require('../models/Collateral');
const Loan = require('../models/Loan');
const sequelize = require('../config/database');
const { generateLoanAgreementPDF } = require('../services/loanAgreementService');
const path = require('path');
const fs = require('fs');
const multer = require('multer');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads/signed_agreements');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'signed_loan_' + req.params.id + '_' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: function (req, file, cb) {
    if (file.mimetype !== 'application/pdf') {
      return cb(new Error('Only PDF files are allowed'));
    }
    cb(null, true);
  }
});

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

    // 1. Create Borrower
    const newBorrower = await Borrower.create(borrower, { transaction });

    // 2. Create Collateral linked to borrower
    const newCollateral = await Collateral.create({
      ...collateral,
      borrowerId: newBorrower.id
    }, { transaction });

    // 3. Get standard interest rates
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

    // 4. Validate loan business rules
    const amount = parseFloat(loan.amountIssued);
    const period = parseInt(loan.loanPeriod);

    if (period === 4 && amount < businessRules.minAmountFor4Weeks) {
      await transaction.rollback();
      return res.status(400).send({
        error: `4-week loans require a minimum of KSH ${businessRules.minAmountFor4Weeks.toLocaleString()}`
      });
    }

    // 5. Determine interest rate
    let interestRate;
    if (amount > businessRules.negotiableThreshold) {
      // Negotiable loan - use custom rate if provided
      if (!loan.interestRate) {
        await transaction.rollback();
        return res.status(400).send({
          error: 'Loans above KSH 50,000 require a custom interest rate'
        });
      }
      interestRate = parseFloat(loan.interestRate);
    } else {
      // Standard loan - use fixed rate
      interestRate = standardRates[period];
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
      isNegotiable: amount > businessRules.negotiableThreshold,
      gracePeriodEnd: gracePeriodEnd,
      branchId: req.user.currentBranchId || null,
      agreementStatus: 'pending_upload' // NEW: Agreement workflow status
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
      return res.status(404).send({ error: 'Agreement PDF has not been generated yet' });
    }

    // Verify the file exists
    if (!fs.existsSync(loan.unsignedAgreementPath)) {
      return res.status(404).send({ error: 'Agreement PDF file not found on server' });
    }

    // Send the file for download
    res.download(loan.unsignedAgreementPath, `Loan_Agreement_${loan.id}_${loan.borrower.fullName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error downloading agreement:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Upload signed loan agreement
 * POST /api/loan-applications/:id/upload-signed
 */
router.post('/:id/upload-signed', auth, upload.single('signedAgreement'), async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id);

    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    if (!req.file) {
      return res.status(400).send({ error: 'No file uploaded' });
    }

    // Update loan with signed agreement details
    await loan.update({
      signedAgreementPath: req.file.path,
      signedAgreementFilename: req.file.filename,
      signedAgreementUploadedAt: new Date(),
      signedAgreementUploadedBy: req.user.id,
      agreementStatus: 'pending_approval'
    });

    res.send({
      success: true,
      message: 'Signed agreement uploaded successfully. Awaiting admin approval.',
      loan: {
        id: loan.id,
        agreementStatus: loan.agreementStatus,
        uploadedAt: loan.signedAgreementUploadedAt
      }
    });
  } catch (error) {
    console.error('Error uploading signed agreement:', error);
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

    if (loan.agreementStatus !== 'pending_approval') {
      return res.status(400).send({ error: 'Loan is not pending approval' });
    }

    await loan.update({
      agreementStatus: 'approved',
      agreementApprovedAt: new Date(),
      agreementApprovedBy: req.user.id,
      agreementNotes: req.body.notes || null
    });

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

    if (loan.agreementStatus !== 'pending_approval') {
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
 * Download signed loan agreement PDF
 * GET /api/loan-applications/:id/download-signed
 */
router.get('/:id/download-signed', auth, async (req, res) => {
  try {
    const loan = await Loan.findByPk(req.params.id, {
      include: [{ model: Borrower, as: 'borrower' }]
    });

    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    if (!loan.signedAgreementPath) {
      return res.status(404).send({ error: 'No signed agreement uploaded yet' });
    }

    if (!fs.existsSync(loan.signedAgreementPath)) {
      return res.status(404).send({ error: 'Signed agreement file not found' });
    }

    res.download(loan.signedAgreementPath, `Signed_Loan_Agreement_${loan.id}_${loan.borrower.fullName.replace(/\s+/g, '_')}.pdf`);
  } catch (error) {
    console.error('Error downloading signed agreement:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Delete a loan application (only if status is pending_upload)
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

    // Only allow deletion if agreement status is pending_upload
    if (loan.agreementStatus !== 'pending_upload') {
      await transaction.rollback();
      return res.status(400).send({
        error: 'Can only delete loans with pending upload status'
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
 * Update loan application details (only if status is pending_upload)
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

    // Only allow updates if agreement status is pending_upload
    if (loan.agreementStatus !== 'pending_upload') {
      await transaction.rollback();
      return res.status(400).send({
        error: 'Can only edit loans with pending upload status'
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

module.exports = router;
