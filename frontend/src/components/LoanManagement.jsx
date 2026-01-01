import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, IconButton, AppBar, Toolbar, Select, MenuItem, FormControl,
  InputLabel, Chip, Box, Alert, Divider, Pagination
} from '@mui/material';
import { Add, Edit, Delete, Payment, Calculate } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const LoanManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [loans, setLoans] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [borrowers, setBorrowers] = useState([]);
  const [collaterals, setCollaterals] = useState([]);
  const [interestRates, setInterestRates] = useState({});
  const [businessRules, setBusinessRules] = useState({});
  const [open, setOpen] = useState(false);
  const [paymentOpen, setPaymentOpen] = useState(false);
  const [editingLoan, setEditingLoan] = useState(null);
  const [selectedLoan, setSelectedLoan] = useState(null);
  const [formData, setFormData] = useState({
    borrowerId: '',
    collateralId: '',
    amountIssued: '',
    loanPeriod: '',
    interestRate: '',
    isNegotiable: false,
    dateIssued: new Date().toISOString().split('T')[0]
  });
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [validationErrors, setValidationErrors] = useState([]);
  const [loanCalculation, setLoanCalculation] = useState(null);

  // Fetch interest rates and business rules
  const fetchInterestRates = async () => {
    try {
      const res = await axios.get('/api/loans/interest-rates');
      setInterestRates(res.data.standardRates);
      setBusinessRules(res.data.rules);
    } catch (err) {
      console.error('Error fetching interest rates:', err);
    }
  };

  const fetchLoans = async (page = 1) => {
    try {
      const res = await axios.get(`/api/loans?page=${page}&limit=10`);
      setLoans(res.data.data || res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching loans:', err);
    }
  };

  const fetchBorrowers = async () => {
    try {
      const res = await axios.get('/api/borrowers?limit=1000');
      setBorrowers(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching borrowers:', err);
    }
  };

  const fetchCollaterals = async () => {
    try {
      const res = await axios.get('/api/collaterals?limit=1000');
      setCollaterals(res.data.data || res.data);
    } catch (err) {
      console.error('Error fetching collaterals:', err);
    }
  };

  const handlePageChange = (_event, value) => {
    fetchLoans(value);
  };

  useEffect(() => {
    fetchInterestRates();
    fetchLoans();
    fetchBorrowers();
    fetchCollaterals();
  }, []);

  // Auto-calculate interest rate and validate based on business rules
  useEffect(() => {
    if (formData.amountIssued && formData.loanPeriod) {
      const amount = parseFloat(formData.amountIssued);
      const period = parseInt(formData.loanPeriod);
      const errors = [];

      // RULE 1: 4-week loans require minimum 12k
      if (period === 4 && amount < businessRules.minAmountFor4Weeks) {
        errors.push(`4-week (1 month) loans require a minimum of KSH ${businessRules.minAmountFor4Weeks?.toLocaleString()}`);
      }

      // RULE 2: Loans above 50k are negotiable
      if (amount > businessRules.negotiableThreshold) {
        // For loans >50k, mark as negotiable and allow admin to set custom rate
        if (!formData.isNegotiable) {
          setFormData(prev => ({ ...prev, isNegotiable: true }));
        }
      } else {
        // For loans <=50k, use standard rates and cannot be negotiable
        if (formData.isNegotiable) {
          setFormData(prev => ({ ...prev, isNegotiable: false }));
        }
        // Auto-set interest rate from standard rates
        if (interestRates[period]) {
          setFormData(prev => ({ ...prev, interestRate: interestRates[period] }));
        }
      }

      // Calculate loan preview
      const rate = formData.isNegotiable && formData.interestRate
        ? parseFloat(formData.interestRate)
        : interestRates[period];

      if (rate) {
        const interestAmount = amount * (rate / 100);
        const totalAmount = amount + interestAmount;
        setLoanCalculation({
          principal: amount,
          interestRate: rate,
          interestAmount: interestAmount.toFixed(2),
          totalAmount: totalAmount.toFixed(2),
          period: `${period} week(s)`
        });
      }

      setValidationErrors(errors);
    } else {
      setLoanCalculation(null);
      setValidationErrors([]);
    }
  }, [formData.amountIssued, formData.loanPeriod, formData.isNegotiable, formData.interestRate, interestRates, businessRules]);

  const filteredLoans = loans.filter((loan) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      loan.borrower?.fullName?.toLowerCase().includes(search) ||
      loan.collateral?.itemName?.toLowerCase().includes(search) ||
      loan.status?.toLowerCase().includes(search) ||
      loan.id?.toString().includes(search) ||
      loan.amountIssued?.toString().includes(search)
    );
  });

  // Filter collaterals by selected borrower
  const availableCollaterals = formData.borrowerId
    ? collaterals.filter(c => c.borrowerId === parseInt(formData.borrowerId))
    : [];

  const handleOpen = (loan = null) => {
    if (loan) {
      // Editing is only allowed for admins
      if (user.role !== 'admin') {
        alert('Only administrators can edit loans');
        return;
      }
      setEditingLoan(loan);
      setFormData({
        borrowerId: loan.borrowerId,
        collateralId: loan.collateralId,
        amountIssued: loan.amountIssued,
        loanPeriod: loan.loanPeriod,
        interestRate: loan.interestRate,
        isNegotiable: loan.isNegotiable,
        dateIssued: loan.dateIssued ? loan.dateIssued.split('T')[0] : new Date().toISOString().split('T')[0]
      });
    } else {
      setEditingLoan(null);
      setFormData({
        borrowerId: '',
        collateralId: '',
        amountIssued: '',
        loanPeriod: '',
        interestRate: '',
        isNegotiable: false,
        dateIssued: new Date().toISOString().split('T')[0]
      });
      setLoanCalculation(null);
      setValidationErrors([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingLoan(null);
    setValidationErrors([]);
    setLoanCalculation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validationErrors.length > 0) {
      alert('Please fix validation errors before submitting');
      return;
    }

    try {
      const payload = {
        borrowerId: parseInt(formData.borrowerId),
        collateralId: parseInt(formData.collateralId),
        amountIssued: parseFloat(formData.amountIssued),
        loanPeriod: parseInt(formData.loanPeriod),
        isNegotiable: formData.isNegotiable,
        dateIssued: formData.dateIssued
      };

      // Only include custom interest rate for negotiable loans
      if (formData.isNegotiable) {
        payload.interestRate = parseFloat(formData.interestRate);
      }

      if (editingLoan) {
        const res = await axios.patch(`/api/loans/${editingLoan.id}`, payload);
        if (res.data.success || res.data.id) {
          alert('Loan updated successfully');
          fetchLoans();
          handleClose();
        }
      } else {
        const res = await axios.post('/api/loans', payload);
        if (res.data.success || res.data.loan) {
          alert(`Loan created successfully!\n\nPrincipal: KSH ${res.data.calculationDetails?.principal?.toLocaleString()}\nInterest Rate: ${res.data.calculationDetails?.interestRate}%\nInterest Amount: KSH ${parseFloat(res.data.calculationDetails?.interestAmount).toLocaleString()}\nTotal Amount: KSH ${parseFloat(res.data.calculationDetails?.totalAmount).toLocaleString()}\nDue Date: ${res.data.calculationDetails?.dueDate}`);
          fetchLoans();
          handleClose();
        }
      }
    } catch (err) {
      console.error('Error saving loan:', err);
      const errorMsg = err.response?.data?.details?.join('\n') || err.response?.data?.error || err.response?.data?.message || 'Error saving loan';
      alert(errorMsg);
    }
  };

  const handleDelete = async (id) => {
    if (user.role !== 'admin') {
      alert('Only administrators can delete loans');
      return;
    }

    if (window.confirm('Are you sure you want to delete this loan?')) {
      try {
        await axios.delete(`/api/loans/${id}`);
        fetchLoans();
        alert('Loan deleted successfully');
      } catch (err) {
        console.error('Error deleting loan:', err);
        alert(err.response?.data?.error || 'Error deleting loan');
      }
    }
  };

  const handlePaymentOpen = (loan) => {
    setSelectedLoan(loan);
    setPaymentData({
      amount: '',
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMethod: 'cash'
    });
    setPaymentOpen(true);
  };

  const handlePaymentClose = () => {
    setPaymentOpen(false);
    setSelectedLoan(null);
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`/api/loans/${selectedLoan.id}/payment`, paymentData);
      if (res.data.success) {
        alert(`Payment recorded successfully!\n\nAmount Paid: KSH ${res.data.paymentDetails?.amountPaid?.toLocaleString()}\nTotal Repaid: KSH ${res.data.paymentDetails?.totalRepaid?.toLocaleString()}\nRemaining Balance: KSH ${res.data.paymentDetails?.remainingBalance?.toLocaleString()}`);
        fetchLoans();
        handlePaymentClose();
      }
    } catch (err) {
      console.error('Error making payment:', err);
      alert(err.response?.data?.error || 'Error making payment');
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'due': return 'warning';
      case 'pastDue': return 'error';
      case 'paid': return 'info';
      case 'defaulted': return 'error';
      default: return 'default';
    }
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static" sx={{  }}>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🏦 Core Q Capital - Loan Management
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button color="inherit" onClick={() => navigate(user.role === 'admin' ? '/admin' : '/employee')}>Dashboard</Button>
            <Button color="inherit" onClick={() => navigate('/borrowers')}>Borrowers</Button>
            <Button color="inherit" onClick={() => navigate('/loans')}>Loans</Button>
            <Button color="inherit" onClick={() => navigate('/collaterals')}>Collaterals</Button>
            <Button color="inherit" onClick={() => navigate('/expenses')}>Expenses</Button>
            <Button color="inherit" onClick={() => navigate('/reports')}>Reports</Button>
            {user.role === 'admin' && <Button color="inherit" onClick={() => navigate('/settings')}>Settings</Button>}
            {user.role === 'admin' && <Button color="inherit" onClick={() => navigate('/users')}>Users</Button>}
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Loans</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Issue Loan
          </Button>
        </Grid>

        {/* Interest Rate Information */}
        <Paper sx={{ p: 2, mb: 2 }}>
          <Typography variant="h6" gutterBottom sx={{ color: 'primary.main' }}>Standard Interest Rates</Typography>
          <Grid container spacing={2}>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2"><strong>1 Week:</strong> {interestRates[1]}%</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2"><strong>2 Weeks:</strong> {interestRates[2]}%</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2"><strong>3 Weeks:</strong> {interestRates[3]}%</Typography>
            </Grid>
            <Grid item xs={6} sm={3}>
              <Typography variant="body2"><strong>4 Weeks:</strong> {interestRates[4]}%</Typography>
            </Grid>
          </Grid>
          <Divider sx={{ my: 1 }} />
          <Typography variant="caption" color="textSecondary">
            • 4-week loans require minimum KSH {businessRules.minAmountFor4Weeks?.toLocaleString()}<br />
            • Loans above KSH {businessRules.negotiableThreshold?.toLocaleString()} have negotiable terms (Admin only)
          </Typography>
        </Paper>

        <TextField
          fullWidth
          label="Search Loans"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by borrower name, collateral item, status, loan ID, or amount..."
          sx={{ mb: 2 }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Borrower</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount Issued</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Interest Rate</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Period</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Total Amount</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Amount Repaid</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Due Date</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredLoans.map((loan) => (
                <TableRow key={loan.id}>
                  <TableCell>{loan.borrower?.fullName || 'N/A'}</TableCell>
                  <TableCell>KSH {parseFloat(loan.amountIssued).toLocaleString()}</TableCell>
                  <TableCell>{loan.interestRate}% {loan.isNegotiable && <Chip label="Negotiable" size="small" color="secondary" sx={{ ml: 1 }} />}</TableCell>
                  <TableCell>{loan.loanPeriod} week(s)</TableCell>
                  <TableCell>KSH {parseFloat(loan.totalAmount).toLocaleString()}</TableCell>
                  <TableCell>KSH {parseFloat(loan.amountRepaid || 0).toLocaleString()}</TableCell>
                  <TableCell>{new Date(loan.dueDate).toLocaleDateString()}</TableCell>
                  <TableCell>
                    <Chip label={loan.status} color={getStatusColor(loan.status)} />
                  </TableCell>
                  <TableCell>
                    {user.role === 'admin' && (
                      <IconButton onClick={() => handleOpen(loan)} size="small" title="Edit Loan">
                        <Edit />
                      </IconButton>
                    )}
                    <IconButton onClick={() => handlePaymentOpen(loan)} size="small" title="Make Payment">
                      <Payment />
                    </IconButton>
                    {user.role === 'admin' && (
                      <IconButton onClick={() => handleDelete(loan.id)} size="small" title="Delete Loan">
                        <Delete />
                      </IconButton>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {pagination.totalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
            <Pagination
              count={pagination.totalPages}
              page={pagination.currentPage}
              onChange={handlePageChange}
              color="primary"
              size="large"
              showFirstButton
              showLastButton
            />
          </Box>
        )}

        {/* Add/Edit Loan Dialog */}
        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{editingLoan ? 'Edit Loan' : 'Issue New Loan'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationErrors.map((error, idx) => (
                    <div key={idx}>{error}</div>
                  ))}
                </Alert>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Borrower</InputLabel>
                    <Select
                      value={formData.borrowerId}
                      onChange={(e) => setFormData({...formData, borrowerId: e.target.value, collateralId: ''})}
                      disabled={editingLoan}
                    >
                      {borrowers.map((borrower) => (
                        <MenuItem key={borrower.id} value={borrower.id}>
                          {borrower.fullName}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required disabled={!formData.borrowerId}>
                    <InputLabel>Collateral</InputLabel>
                    <Select
                      value={formData.collateralId}
                      onChange={(e) => setFormData({...formData, collateralId: e.target.value})}
                      disabled={editingLoan}
                    >
                      {availableCollaterals.map((collateral) => (
                        <MenuItem key={collateral.id} value={collateral.id}>
                          {collateral.itemName} - {collateral.category}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Amount to Issue (KSH)"
                    required
                    type="number"
                    value={formData.amountIssued}
                    onChange={(e) => setFormData({...formData, amountIssued: e.target.value})}
                    helperText="Minimum 12k for 4-week loans"
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Date Issued"
                    required
                    type="date"
                    value={formData.dateIssued}
                    onChange={(e) => setFormData({...formData, dateIssued: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>

                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Loan Period</InputLabel>
                    <Select
                      value={formData.loanPeriod}
                      onChange={(e) => setFormData({...formData, loanPeriod: e.target.value})}
                    >
                      <MenuItem value={1}>1 Week ({interestRates[1]}% interest)</MenuItem>
                      <MenuItem value={2}>2 Weeks ({interestRates[2]}% interest)</MenuItem>
                      <MenuItem value={3}>3 Weeks ({interestRates[3]}% interest)</MenuItem>
                      <MenuItem value={4}>4 Weeks - 1 Month ({interestRates[4]}% interest)</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>

                {/* Show interest rate field only for negotiable loans (>50k) and admin users */}
                {formData.isNegotiable && user.role === 'admin' && (
                  <Grid item xs={12} sm={6}>
                    <TextField
                      fullWidth
                      label="Custom Interest Rate (%)"
                      required
                      type="number"
                      step="0.01"
                      value={formData.interestRate}
                      onChange={(e) => setFormData({...formData, interestRate: e.target.value})}
                      helperText="For negotiable loans above 50k"
                    />
                  </Grid>
                )}

                {formData.isNegotiable && (
                  <Grid item xs={12}>
                    <Alert severity="info">
                      This loan amount exceeds KSH {businessRules.negotiableThreshold?.toLocaleString()} and has negotiable terms. {user.role === 'admin' ? 'You can set a custom interest rate and period.' : 'An administrator must approve this loan.'}
                    </Alert>
                  </Grid>
                )}

                {/* Loan Calculation Preview */}
                {loanCalculation && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2 }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center' }}>
                        <Calculate sx={{ mr: 1 }} /> Loan Calculation
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2"><strong>Principal:</strong> KSH {parseFloat(loanCalculation.principal).toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2"><strong>Interest Rate:</strong> {loanCalculation.interestRate}%</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2"><strong>Interest Amount:</strong> KSH {parseFloat(loanCalculation.interestAmount).toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2"><strong>Period:</strong> {loanCalculation.period}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1 }} />
                          <Typography variant="h6" color="primary"><strong>Total Amount Due:</strong> KSH {parseFloat(loanCalculation.totalAmount).toLocaleString()}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={validationErrors.length > 0}
              >
                {editingLoan ? 'Update Loan' : 'Issue Loan'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Payment Dialog */}
        <Dialog open={paymentOpen} onClose={handlePaymentClose} maxWidth="sm" fullWidth>
          <DialogTitle>Record Payment</DialogTitle>
          <form onSubmit={handlePayment}>
            <DialogContent>
              {selectedLoan && (
                <>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Borrower:</strong> {selectedLoan.borrower?.fullName}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Principal:</strong> KSH {parseFloat(selectedLoan.amountIssued).toLocaleString()}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 1 }}>
                    <strong>Total Due:</strong> KSH {(parseFloat(selectedLoan.totalAmount) + parseFloat(selectedLoan.penalties || 0)).toLocaleString()}
                  </Typography>
                  <Typography variant="body1" sx={{ mb: 2 }} color="primary">
                    <strong>Remaining Balance:</strong> KSH {(parseFloat(selectedLoan.totalAmount) + parseFloat(selectedLoan.penalties || 0) - parseFloat(selectedLoan.amountRepaid || 0)).toLocaleString()}
                  </Typography>
                  <Divider sx={{ mb: 2 }} />
                </>
              )}

              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Payment Amount (KSH)"
                    required
                    type="number"
                    step="0.01"
                    value={paymentData.amount}
                    onChange={(e) => setPaymentData({...paymentData, amount: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Payment Date"
                    required
                    type="date"
                    value={paymentData.paymentDate}
                    onChange={(e) => setPaymentData({...paymentData, paymentDate: e.target.value})}
                    InputLabelProps={{ shrink: true }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Payment Method</InputLabel>
                    <Select
                      value={paymentData.paymentMethod}
                      onChange={(e) => setPaymentData({...paymentData, paymentMethod: e.target.value})}
                    >
                      <MenuItem value="cash">Cash</MenuItem>
                      <MenuItem value="mpesa">M-Pesa</MenuItem>
                      <MenuItem value="bank">Bank Transfer</MenuItem>
                      <MenuItem value="cheque">Cheque</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handlePaymentClose}>Cancel</Button>
              <Button type="submit" variant="contained">
                Record Payment
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
};

export default LoanManagement;
