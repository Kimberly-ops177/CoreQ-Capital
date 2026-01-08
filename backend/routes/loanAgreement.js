const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { auth, adminOnly } = require('../middleware/auth');
const Loan = require('../models/Loan');
const Borrower = require('../models/Borrower');
const Collateral = require('../models/Collateral');
const { sendCustomSMS } = require('../services/smsService');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads/signed_agreements');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `signed_agreement_${req.params.loanId}_${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req, file, cb) => {
  // Accept images and PDFs only
  const allowedTypes = /jpeg|jpg|png|pdf/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Only JPEG, PNG, and PDF files are allowed!'));
  }
};

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
  fileFilter: fileFilter
});

/**
 * Upload signed loan agreement
 * POST /api/loan-agreements/:loanId/upload
 */
router.post('/:loanId/upload', auth, upload.single('signedAgreement'), async (req, res) => {
  try {
    const { loanId } = req.params;

    if (!req.file) {
      return res.status(400).send({ error: 'No file uploaded' });
    }

    // Find the loan
    const loan = await Loan.findByPk(loanId, {
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ]
    });

    if (!loan) {
      // Delete uploaded file if loan not found
      fs.unlinkSync(req.file.path);
      return res.status(404).send({ error: 'Loan not found' });
    }

    // Check if user is authorized (borrower's employee/admin or admin)
    if (req.user.role !== 'admin' && loan.branchId !== req.user.currentBranchId) {
      fs.unlinkSync(req.file.path);
      return res.status(403).send({ error: 'Access denied to this loan' });
    }

    // Update loan with signed agreement info
    await loan.update({
      signedAgreementPath: req.file.path,
      signedAgreementFilename: req.file.filename,
      signedAgreementUploadedAt: new Date(),
      signedAgreementUploadedBy: req.user.id,
      agreementStatus: 'pending_approval' // Awaiting admin approval
    });

    // Reload loan with updated data
    await loan.reload();

    res.send({
      success: true,
      message: 'Signed agreement uploaded successfully. Awaiting admin approval.',
      loan: {
        id: loan.id,
        agreementStatus: loan.agreementStatus,
        uploadedAt: loan.signedAgreementUploadedAt,
        uploadedBy: req.user.name
      }
    });

  } catch (error) {
    console.error('Error uploading signed agreement:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).send({ error: error.message });
  }
});

/**
 * Approve signed loan agreement (Admin only)
 * POST /api/loan-agreements/:loanId/approve
 */
router.post('/:loanId/approve', auth, adminOnly, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { notes } = req.body;

    const loan = await Loan.findByPk(loanId, {
      include: [
        { model: Borrower, as: 'borrower' }
      ]
    });

    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    // Approve the agreement
    await loan.update({
      agreementStatus: 'approved',
      agreementApprovedAt: new Date(),
      agreementApprovedBy: req.user.id,
      agreementNotes: notes || null
    });

    // Send SMS notifications to the client
    if (loan.borrower && loan.borrower.phoneNumber) {
      try {
        const dueDate = new Date(loan.dueDate).toLocaleDateString('en-KE', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        });

        // First SMS: Loan approval notification
        const approvalMessage = `Your loan of KSH ${parseFloat(loan.amountIssued).toLocaleString()} has been approved! Due date: ${dueDate}. Total repayment: KSH ${parseFloat(loan.totalAmount).toLocaleString()}.`;
        await sendCustomSMS(loan.borrower.phoneNumber, loan.borrower.fullName, approvalMessage);

        // Second SMS: Payment instructions
        const paymentMessage = `Payment Details - Paybill: 522533, Account: 7862638. Please pay on or before ${dueDate}. Thank you for choosing Core Q Capital.`;
        await sendCustomSMS(loan.borrower.phoneNumber, loan.borrower.fullName, paymentMessage);

        console.log(`SMS notifications sent to ${loan.borrower.fullName} for loan ${loanId}`);
      } catch (smsError) {
        console.error('Error sending SMS notifications:', smsError);
        // Don't fail the approval if SMS fails
      }
    }

    res.send({
      success: true,
      message: 'Loan agreement approved successfully. SMS notifications sent to client.',
      loan: {
        id: loan.id,
        agreementStatus: loan.agreementStatus,
        approvedAt: loan.agreementApprovedAt,
        approvedBy: req.user.name
      }
    });

  } catch (error) {
    console.error('Error approving agreement:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Reject signed loan agreement (Admin only)
 * POST /api/loan-agreements/:loanId/reject
 */
router.post('/:loanId/reject', auth, adminOnly, async (req, res) => {
  try {
    const { loanId } = req.params;
    const { reason } = req.body;

    if (!reason) {
      return res.status(400).send({ error: 'Rejection reason is required' });
    }

    const loan = await Loan.findByPk(loanId);

    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    if (!loan.signedAgreementPath) {
      return res.status(400).send({ error: 'No signed agreement uploaded for this loan' });
    }

    // Reject the agreement
    await loan.update({
      agreementStatus: 'rejected',
      agreementRejectedAt: new Date(),
      agreementRejectedBy: req.user.id,
      agreementNotes: reason
    });

    res.send({
      success: true,
      message: 'Loan agreement rejected. Borrower will need to resubmit.',
      loan: {
        id: loan.id,
        agreementStatus: loan.agreementStatus,
        rejectedAt: loan.agreementRejectedAt,
        rejectedBy: req.user.name,
        reason: reason
      }
    });

  } catch (error) {
    console.error('Error rejecting agreement:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Download signed agreement (Admin or loan officer)
 * GET /api/loan-agreements/:loanId/download
 */
router.get('/:loanId/download', auth, async (req, res) => {
  try {
    const { loanId } = req.params;

    const loan = await Loan.findByPk(loanId);

    if (!loan) {
      return res.status(404).send({ error: 'Loan not found' });
    }

    // Check authorization
    if (req.user.role !== 'admin' && loan.branchId !== req.user.currentBranchId) {
      return res.status(403).send({ error: 'Access denied to this loan' });
    }

    if (!loan.signedAgreementPath || !fs.existsSync(loan.signedAgreementPath)) {
      return res.status(404).send({ error: 'Signed agreement file not found' });
    }

    res.download(loan.signedAgreementPath, loan.signedAgreementFilename);

  } catch (error) {
    console.error('Error downloading agreement:', error);
    res.status(500).send({ error: error.message });
  }
});

/**
 * Get all loans with pending agreement approvals (Admin only)
 * GET /api/loan-agreements/pending
 */
router.get('/pending', auth, adminOnly, async (req, res) => {
  try {
    const pendingLoans = await Loan.findAll({
      where: {
        agreementStatus: 'pending_approval'
      },
      include: [
        { model: Borrower, as: 'borrower' },
        { model: Collateral, as: 'collateral' }
      ],
      order: [['signedAgreementUploadedAt', 'DESC']]
    });

    res.send({
      success: true,
      count: pendingLoans.length,
      loans: pendingLoans
    });

  } catch (error) {
    console.error('Error fetching pending agreements:', error);
    res.status(500).send({ error: error.message });
  }
});

module.exports = router;
