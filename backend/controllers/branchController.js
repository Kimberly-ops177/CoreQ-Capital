const Branch = require('../models/Branch');
const BranchCapital = require('../models/BranchCapital');
const UserBranchAccess = require('../models/UserBranchAccess');
const { Op } = require('sequelize');

const getBranches = async (req, res) => {
  try {
    const branches = await Branch.findAll({
      order: [['createdAt', 'DESC']],
      include: [
        {
          model: BranchCapital,
          as: 'capitalTransactions',
          attributes: ['amount', 'capitalType', 'transactionDate']
        }
      ]
    });

    // Calculate total capital for each branch
    const branchesWithCapital = branches.map(branch => {
      const branchData = branch.toJSON();
      const capitalTransactions = branchData.capitalTransactions || [];

      branchData.totalCapital = capitalTransactions.reduce((total, transaction) => {
        if (transaction.capitalType === 'withdrawal') {
          return total - parseFloat(transaction.amount);
        }
        return total + parseFloat(transaction.amount);
      }, 0);

      return branchData;
    });

    res.send(branchesWithCapital);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const getBranch = async (req, res) => {
  try {
    const branch = await Branch.findByPk(req.params.id, {
      include: [
        {
          model: BranchCapital,
          as: 'capitalTransactions',
          order: [['transactionDate', 'DESC']]
        }
      ]
    });

    if (!branch) {
      return res.status(404).send({ error: 'Branch not found' });
    }

    const branchData = branch.toJSON();
    const capitalTransactions = branchData.capitalTransactions || [];

    branchData.totalCapital = capitalTransactions.reduce((total, transaction) => {
      if (transaction.capitalType === 'withdrawal') {
        return total - parseFloat(transaction.amount);
      }
      return total + parseFloat(transaction.amount);
    }, 0);

    res.send(branchData);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const createBranch = async (req, res) => {
  try {
    const { branchName, branchCode, location, address, phone, email, managerName,
            minLoanAmount, maxLoanAmount, minInterestRate, maxInterestRate, initialCapital } = req.body;

    // Check if branch code already exists
    const existingBranch = await Branch.findOne({ where: { [Op.or]: [{ branchCode }, { branchName }] } });
    if (existingBranch) {
      return res.status(400).send({ error: 'Branch with this name or code already exists' });
    }

    const branch = await Branch.create({
      branchName,
      branchCode,
      location,
      address,
      phone,
      email,
      managerName,
      minLoanAmount: minLoanAmount || 1000,
      maxLoanAmount: maxLoanAmount || 100000,
      minInterestRate: minInterestRate || 5.00,
      maxInterestRate: maxInterestRate || 30.00
    });

    // Add initial capital if provided
    if (initialCapital && parseFloat(initialCapital) > 0) {
      await BranchCapital.create({
        branchId: branch.id,
        amount: initialCapital,
        capitalType: 'initial',
        description: 'Initial capital',
        addedBy: req.user.id
      });
    }

    res.status(201).send(branch);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const updateBranch = async (req, res) => {
  try {
    const [updatedRowsCount] = await Branch.update(req.body, {
      where: { id: req.params.id }
    });

    if (updatedRowsCount === 0) {
      return res.status(404).send({ error: 'Branch not found' });
    }

    const branch = await Branch.findByPk(req.params.id);
    res.send(branch);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const deleteBranch = async (req, res) => {
  try {
    // Check if any users, borrowers, loans, or collaterals are assigned to this branch
    const User = require('../models/User');
    const Borrower = require('../models/Borrower');
    const Loan = require('../models/Loan');
    const Collateral = require('../models/Collateral');

    const [usersCount, borrowersCount, loansCount, collateralsCount] = await Promise.all([
      User.count({ where: { currentBranchId: req.params.id } }),
      Borrower.count({ where: { branchId: req.params.id } }),
      Loan.count({ where: { branchId: req.params.id } }),
      Collateral.count({ where: { branchId: req.params.id } })
    ]);

    if (usersCount > 0 || borrowersCount > 0 || loansCount > 0 || collateralsCount > 0) {
      return res.status(400).send({
        error: 'Cannot delete branch',
        message: `This branch has ${usersCount} users, ${borrowersCount} borrowers, ${loansCount} loans, and ${collateralsCount} collaterals. Reassign them first.`
      });
    }

    const deletedRowsCount = await Branch.destroy({
      where: { id: req.params.id }
    });

    if (deletedRowsCount === 0) {
      return res.status(404).send({ error: 'Branch not found' });
    }

    res.send({ message: 'Branch deleted successfully' });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

// Capital management
const addCapital = async (req, res) => {
  try {
    const { branchId, amount, capitalType, description } = req.body;

    const branch = await Branch.findByPk(branchId);
    if (!branch) {
      return res.status(404).send({ error: 'Branch not found' });
    }

    const capital = await BranchCapital.create({
      branchId,
      amount,
      capitalType: capitalType || 'addition',
      description,
      addedBy: req.user.id
    });

    res.status(201).send(capital);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const getCapitalHistory = async (req, res) => {
  try {
    const { branchId } = req.params;

    const capitalHistory = await BranchCapital.findAll({
      where: { branchId },
      include: [
        {
          model: require('../models/User'),
          as: 'user',
          attributes: ['id', 'name', 'email']
        }
      ],
      order: [['transactionDate', 'DESC']]
    });

    res.send(capitalHistory);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

// User branch access management
const grantBranchAccess = async (req, res) => {
  try {
    const { userId, branchId, canView, canEdit, canDelete } = req.body;

    const [access, created] = await UserBranchAccess.findOrCreate({
      where: { userId, branchId },
      defaults: { canView, canEdit, canDelete }
    });

    if (!created) {
      await access.update({ canView, canEdit, canDelete });
    }

    res.status(created ? 201 : 200).send(access);
  } catch (e) {
    res.status(400).send({ error: e.message });
  }
};

const revokeBranchAccess = async (req, res) => {
  try {
    const { userId, branchId } = req.body;

    const deletedCount = await UserBranchAccess.destroy({
      where: { userId, branchId }
    });

    if (deletedCount === 0) {
      return res.status(404).send({ error: 'Access record not found' });
    }

    res.send({ message: 'Branch access revoked successfully' });
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

const getUserBranchAccess = async (req, res) => {
  try {
    const { userId } = req.params;

    const access = await UserBranchAccess.findAll({
      where: { userId },
      include: [
        {
          model: Branch,
          as: 'branch',
          attributes: ['id', 'branchName', 'branchCode', 'location']
        }
      ]
    });

    res.send(access);
  } catch (e) {
    res.status(500).send({ error: e.message });
  }
};

module.exports = {
  getBranches,
  getBranch,
  createBranch,
  updateBranch,
  deleteBranch,
  addCapital,
  getCapitalHistory,
  grantBranchAccess,
  revokeBranchAccess,
  getUserBranchAccess
};
