import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, IconButton, Select, MenuItem, FormControl,
  InputLabel, Chip, Box, Alert, Divider, Pagination, List, ListItem, ListItemButton, ListItemText,
  InputAdornment
} from '@mui/material';
import { Add, Edit, Delete, Payment, Calculate, Search, Person } from '@mui/icons-material';
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
    amountIssued: '',
    loanPeriod: '',
    dateIssued: new Date().toISOString().split('T')[0]
  });
  // New collateral fields for each loan
  const [newCollateral, setNewCollateral] = useState({
    category: '',
    itemName: '',
    modelNumber: '',
    serialNumber: '',
    itemCondition: 'Good'
  });
  const [selectedBorrower, setSelectedBorrower] = useState(null);
  const [paymentData, setPaymentData] = useState({
    amount: '',
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: 'cash'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [borrowerSearchTerm, setBorrowerSearchTerm] = useState('');
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
      console.log('Fetching loans page', page);
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
    console.log('LoanManagement mounted, starting data fetch');
    fetchInterestRates();
    fetchLoans();
    fetchBorrowers();
    fetchCollaterals();
  }, []);

  // Auto-calculate interest rate and validate based on business rules
  // Interest rates are FIXED for ALL borrowers - no negotiation
  useEffect(() => {
    if (formData.amountIssued && formData.loanPeriod) {
      const amount = parseFloat(formData.amountIssued);
      const period = parseInt(formData.loanPeriod);
      const errors = [];

      // RULE: 4-week loans require minimum 12k
      if (period === 4 && amount < businessRules.minAmountFor4Weeks) {
        errors.push(`4-week (1 month) loans require a minimum of KSH ${businessRules.minAmountFor4Weeks?.toLocaleString()}`);
      }

      // Calculate loan preview using fixed rates
      const rate = interestRates[period];

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
  }, [formData.amountIssued, formData.loanPeriod, interestRates, businessRules]);

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
  // Handle borrower selection and auto-fill their details
  const handleBorrowerChange = (borrowerId) => {
    setFormData(prev => ({ ...prev, borrowerId }));
    if (borrowerId) {
      const borrower = borrowers.find(b => b.id === parseInt(borrowerId));
      setSelectedBorrower(borrower || null);
    } else {
      setSelectedBorrower(null);
    }
  };

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
        amountIssued: loan.amountIssued,
        loanPeriod: loan.loanPeriod,
        dateIssued: loan.dateIssued ? loan.dateIssued.split('T')[0] : new Date().toISOString().split('T')[0]
      });
      // For editing, show existing borrower info
      const borrower = borrowers.find(b => b.id === loan.borrowerId);
      setSelectedBorrower(borrower || null);
    } else {
      setEditingLoan(null);
      setFormData({
        borrowerId: '',
        amountIssued: '',
        loanPeriod: '',
        dateIssued: new Date().toISOString().split('T')[0]
      });
      setNewCollateral({
        category: '',
        itemName: '',
        modelNumber: '',
        serialNumber: '',
        itemCondition: 'Good'
      });
      setSelectedBorrower(null);
      setBorrowerSearchTerm('');
      setLoanCalculation(null);
      setValidationErrors([]);
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingLoan(null);
    setSelectedBorrower(null);
    setValidationErrors([]);
    setLoanCalculation(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validationErrors.length > 0) {
      alert('Please fix validation errors before submitting');
      return;
    }

    // Validate new collateral fields for new loans
    if (!editingLoan) {
      if (!newCollateral.category || !newCollateral.itemName || !newCollateral.itemCondition) {
        alert('Please fill in all required collateral fields');
        return;
      }
    }

    try {
      if (editingLoan) {
        // For editing, use the existing loan endpoint
        const payload = {
          amountIssued: parseFloat(formData.amountIssued),
          loanPeriod: parseInt(formData.loanPeriod),
          dateIssued: formData.dateIssued
        };
        const res = await axios.patch(`/api/loans/${editingLoan.id}`, payload);
        if (res.data.success || res.data.id) {
          alert('Loan updated successfully');
          fetchLoans();
          handleClose();
        }
      } else {
        // For new loans, use the loan-applications endpoint which creates collateral
        const payload = {
          borrower: {
            fullName: selectedBorrower.fullName,
            idNumber: selectedBorrower.idNumber,
            phoneNumber: selectedBorrower.phoneNumber,
            email: selectedBorrower.email,
            location: selectedBorrower.location,
            apartment: selectedBorrower.apartment,
            houseNumber: selectedBorrower.houseNumber,
            isStudent: selectedBorrower.isStudent,
            institution: selectedBorrower.institution,
            registrationNumber: selectedBorrower.registrationNumber,
            emergencyNumber: selectedBorrower.emergencyNumber
          },
          collateral: newCollateral,
          loan: {
            amountIssued: parseFloat(formData.amountIssued),
            loanPeriod: parseInt(formData.loanPeriod),
            dateIssued: formData.dateIssued
          }
        };

        const res = await axios.post('/api/loan-applications', payload);
        if (res.data.success || res.data.loan) {
          alert(`Loan created successfully!\n\nLoan ID: ${res.data.loan?.id}\nPrincipal: KSH ${parseFloat(formData.amountIssued).toLocaleString()}\nDue Date: ${new Date(res.data.loan?.dueDate).toLocaleDateString()}`);
          fetchLoans();
          fetchCollaterals(); // Refresh collaterals list
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
    <Container sx={{ py: 4 }}>
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
            • These rates are <strong>fixed and non-negotiable</strong> for all borrowers
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
                <TableCell sx={{ fontWeight: 'bold' }}>Loan ID</TableCell>
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
                  <TableCell>#{loan.id}</TableCell>
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
        <Dialog
          open={open}
          onClose={handleClose}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              bgcolor: '#0A1628',
              color: '#ffffff'
            }
          }}
        >
          <DialogTitle sx={{ bgcolor: '#1A2B45', color: '#00FF9D', fontWeight: 'bold', borderBottom: '1px solid rgba(0,255,157,0.2)' }}>
            {editingLoan ? 'Edit Loan' : 'Issue New Loan'}
          </DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent sx={{ bgcolor: '#0A1628', pt: 3 }}>
              {validationErrors.length > 0 && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {validationErrors.map((error, idx) => (
                    <div key={idx}>{error}</div>
                  ))}
                </Alert>
              )}

              <Grid container spacing={2}>
                {/* Borrower Selection */}
                <Grid item xs={12}>
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#00FF9D' }}>
                    Select Borrower
                  </Typography>
                </Grid>

                {!editingLoan && !selectedBorrower && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth
                        placeholder="Search borrowers by name, ID, phone, or location..."
                        value={borrowerSearchTerm}
                        onChange={(e) => setBorrowerSearchTerm(e.target.value)}
                        InputProps={{
                          startAdornment: (
                            <InputAdornment position="start">
                              <Search sx={{ color: '#00FF9D' }} />
                            </InputAdornment>
                          ),
                        }}
                        sx={{
                          mb: 1,
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            '& fieldset': { borderColor: 'rgba(0,255,157,0.3)' },
                            '&:hover fieldset': { borderColor: '#00FF9D' },
                            '&.Mui-focused fieldset': { borderColor: '#00FF9D' },
                          },
                          '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.5)' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Paper
                        variant="outlined"
                        sx={{
                          maxHeight: 250,
                          overflow: 'auto',
                          bgcolor: '#1A2B45',
                          borderColor: 'rgba(0,255,157,0.3)'
                        }}
                      >
                        <List dense>
                          {borrowers
                            .filter(b => {
                              if (!borrowerSearchTerm) return true;
                              const search = borrowerSearchTerm.toLowerCase();
                              return (
                                b.fullName?.toLowerCase().includes(search) ||
                                b.idNumber?.toLowerCase().includes(search) ||
                                b.phoneNumber?.includes(search) ||
                                b.location?.toLowerCase().includes(search)
                              );
                            })
                            .map((borrower) => (
                              <ListItem key={borrower.id} disablePadding>
                                <ListItemButton
                                  onClick={() => handleBorrowerChange(borrower.id)}
                                  sx={{
                                    py: 1.5,
                                    '&:hover': {
                                      bgcolor: 'rgba(0,255,157,0.1)',
                                    }
                                  }}
                                >
                                  <Person sx={{ mr: 2, color: '#00FF9D' }} />
                                  <ListItemText
                                    primary={
                                      <Typography variant="body1" sx={{ fontWeight: 600, color: '#ffffff' }}>
                                        {borrower.fullName}
                                      </Typography>
                                    }
                                    secondary={
                                      <Typography variant="body2" sx={{ color: '#B0BEC5' }}>
                                        ID: {borrower.idNumber || 'N/A'} | Phone: {borrower.phoneNumber} | {borrower.location}
                                      </Typography>
                                    }
                                  />
                                </ListItemButton>
                              </ListItem>
                            ))}
                          {borrowers.filter(b => {
                            if (!borrowerSearchTerm) return true;
                            const search = borrowerSearchTerm.toLowerCase();
                            return (
                              b.fullName?.toLowerCase().includes(search) ||
                              b.idNumber?.toLowerCase().includes(search) ||
                              b.phoneNumber?.includes(search) ||
                              b.location?.toLowerCase().includes(search)
                            );
                          }).length === 0 && (
                            <ListItem>
                              <ListItemText
                                primary={
                                  <Typography variant="body2" sx={{ color: '#B0BEC5', textAlign: 'center', py: 2 }}>
                                    No borrowers found matching your search
                                  </Typography>
                                }
                              />
                            </ListItem>
                          )}
                        </List>
                      </Paper>
                      <Typography variant="caption" sx={{ color: '#B0BEC5', mt: 1, display: 'block' }}>
                        {borrowers.length} borrowers available. Click on a borrower to select.
                      </Typography>
                    </Grid>
                  </>
                )}

                {/* Show selected borrower details */}
                {selectedBorrower && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(0,255,157,0.1)', border: '1px solid #00FF9D' }}>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#00FF9D' }}>
                          Selected Borrower
                        </Typography>
                        {!editingLoan && (
                          <Button
                            size="small"
                            onClick={() => {
                              setSelectedBorrower(null);
                              setFormData(prev => ({ ...prev, borrowerId: '' }));
                            }}
                            sx={{ color: '#FF4D6A' }}
                          >
                            Change
                          </Button>
                        )}
                      </Box>
                      <Grid container spacing={1}>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>Name:</strong> {selectedBorrower.fullName}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>ID:</strong> {selectedBorrower.idNumber || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>Phone:</strong> {selectedBorrower.phoneNumber}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>Email:</strong> {selectedBorrower.email || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>Location:</strong> {selectedBorrower.location}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>Apartment:</strong> {selectedBorrower.apartment || 'N/A'}</Typography>
                        </Grid>
                        <Grid item xs={6} sm={3}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>House No:</strong> {selectedBorrower.houseNumber || 'N/A'}</Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}

                {/* New Collateral Section - Only for new loans */}
                {!editingLoan && selectedBorrower && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1, borderColor: 'rgba(0,255,157,0.2)' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#00FF9D' }}>
                        New Collateral (Required for each loan)
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required sx={{
                        '& .MuiInputLabel-root': { color: '#B0BEC5' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#00FF9D' },
                        '& .MuiInputLabel-root.MuiInputLabel-shrink': { color: '#00FF9D' },
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: 'rgba(0,255,157,0.3)' },
                          '&:hover fieldset': { borderColor: '#00FF9D' },
                          '&.Mui-focused fieldset': { borderColor: '#00FF9D' },
                        },
                        '& .MuiSelect-icon': { color: '#00FF9D' },
                        '& .MuiSelect-select': {
                          minWidth: '150px'
                        }
                      }}>
                        <InputLabel shrink>Category *</InputLabel>
                        <Select
                          value={newCollateral.category}
                          displayEmpty
                          onChange={(e) => setNewCollateral({...newCollateral, category: e.target.value})}
                          notched
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1A2B45',
                                '& .MuiMenuItem-root': {
                                  color: '#ffffff',
                                  '&:hover': { bgcolor: 'rgba(0,255,157,0.1)' },
                                  '&.Mui-selected': { bgcolor: 'rgba(0,255,157,0.2)' }
                                }
                              }
                            }
                          }}
                        >
                          <MenuItem value="" disabled>
                            <span style={{ color: 'rgba(255,255,255,0.5)' }}>Select category...</span>
                          </MenuItem>
                          <MenuItem value="Smartphone">Smartphone</MenuItem>
                          <MenuItem value="Laptop">Laptop</MenuItem>
                          <MenuItem value="Tablet">Tablet</MenuItem>
                          <MenuItem value="TV">TV</MenuItem>
                          <MenuItem value="Gaming Console">Gaming Console</MenuItem>
                          <MenuItem value="Speaker/Audio">Speaker/Audio</MenuItem>
                          <MenuItem value="Other Electronics">Other Electronics</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="Item Name"
                        value={newCollateral.itemName}
                        onChange={(e) => setNewCollateral({...newCollateral, itemName: e.target.value})}
                        placeholder="e.g., Samsung TV, Gold Ring"
                        sx={{
                          '& .MuiInputLabel-root': { color: '#B0BEC5' },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#00FF9D' },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            '& fieldset': { borderColor: 'rgba(0,255,157,0.3)' },
                            '&:hover fieldset': { borderColor: '#00FF9D' },
                            '&.Mui-focused fieldset': { borderColor: '#00FF9D' },
                          },
                          '& .MuiInputBase-input::placeholder': { color: 'rgba(255,255,255,0.5)' }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Model Number"
                        value={newCollateral.modelNumber}
                        onChange={(e) => setNewCollateral({...newCollateral, modelNumber: e.target.value})}
                        sx={{
                          '& .MuiInputLabel-root': { color: '#B0BEC5' },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#00FF9D' },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            '& fieldset': { borderColor: 'rgba(0,255,157,0.3)' },
                            '&:hover fieldset': { borderColor: '#00FF9D' },
                            '&.Mui-focused fieldset': { borderColor: '#00FF9D' },
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Serial Number"
                        value={newCollateral.serialNumber}
                        onChange={(e) => setNewCollateral({...newCollateral, serialNumber: e.target.value})}
                        sx={{
                          '& .MuiInputLabel-root': { color: '#B0BEC5' },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#00FF9D' },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            '& fieldset': { borderColor: 'rgba(0,255,157,0.3)' },
                            '&:hover fieldset': { borderColor: '#00FF9D' },
                            '&.Mui-focused fieldset': { borderColor: '#00FF9D' },
                          }
                        }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required sx={{
                        '& .MuiInputLabel-root': { color: '#B0BEC5' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#00FF9D' },
                        '& .MuiInputLabel-root.MuiInputLabel-shrink': { color: '#00FF9D' },
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: 'rgba(0,255,157,0.3)' },
                          '&:hover fieldset': { borderColor: '#00FF9D' },
                          '&.Mui-focused fieldset': { borderColor: '#00FF9D' },
                        },
                        '& .MuiSelect-icon': { color: '#00FF9D' },
                        '& .MuiSelect-select': { minWidth: '100px' }
                      }}>
                        <InputLabel shrink>Condition *</InputLabel>
                        <Select
                          value={newCollateral.itemCondition}
                          notched
                          onChange={(e) => setNewCollateral({...newCollateral, itemCondition: e.target.value})}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1A2B45',
                                '& .MuiMenuItem-root': {
                                  color: '#ffffff',
                                  '&:hover': { bgcolor: 'rgba(0,255,157,0.1)' },
                                  '&.Mui-selected': { bgcolor: 'rgba(0,255,157,0.2)' }
                                }
                              }
                            }
                          }}
                        >
                          <MenuItem value="Excellent">Excellent</MenuItem>
                          <MenuItem value="Good">Good</MenuItem>
                          <MenuItem value="Fair">Fair</MenuItem>
                          <MenuItem value="Poor">Poor</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}

                {/* Loan Details Section */}
                {selectedBorrower && (
                  <>
                    <Grid item xs={12}>
                      <Divider sx={{ my: 1, borderColor: 'rgba(0,255,157,0.2)' }} />
                      <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: '#00FF9D' }}>
                        Loan Details
                      </Typography>
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
                        sx={{
                          '& .MuiInputLabel-root': { color: '#B0BEC5' },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#00FF9D' },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            '& fieldset': { borderColor: 'rgba(0,255,157,0.3)' },
                            '&:hover fieldset': { borderColor: '#00FF9D' },
                            '&.Mui-focused fieldset': { borderColor: '#00FF9D' },
                          },
                          '& .MuiFormHelperText-root': { color: '#B0BEC5' }
                        }}
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
                        sx={{
                          '& .MuiInputLabel-root': { color: '#B0BEC5' },
                          '& .MuiInputLabel-root.Mui-focused': { color: '#00FF9D' },
                          '& .MuiOutlinedInput-root': {
                            color: '#ffffff',
                            '& fieldset': { borderColor: 'rgba(0,255,157,0.3)' },
                            '&:hover fieldset': { borderColor: '#00FF9D' },
                            '&.Mui-focused fieldset': { borderColor: '#00FF9D' },
                          }
                        }}
                      />
                    </Grid>

                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth required sx={{
                        '& .MuiInputLabel-root': { color: '#B0BEC5' },
                        '& .MuiInputLabel-root.Mui-focused': { color: '#00FF9D' },
                        '& .MuiInputLabel-root.MuiInputLabel-shrink': { color: '#00FF9D' },
                        '& .MuiOutlinedInput-root': {
                          color: '#ffffff',
                          '& fieldset': { borderColor: 'rgba(0,255,157,0.3)' },
                          '&:hover fieldset': { borderColor: '#00FF9D' },
                          '&.Mui-focused fieldset': { borderColor: '#00FF9D' },
                        },
                        '& .MuiSelect-icon': { color: '#00FF9D' },
                        '& .MuiSelect-select': { minWidth: '150px' }
                      }}>
                        <InputLabel shrink>Period *</InputLabel>
                        <Select
                          value={formData.loanPeriod}
                          displayEmpty
                          notched
                          renderValue={(selected) => {
                            if (!selected) {
                              return <span style={{ color: 'rgba(255,255,255,0.5)' }}>Select period...</span>;
                            }
                            const periodText = {
                              1: `1 Week (${interestRates[1]}%)`,
                              2: `2 Weeks (${interestRates[2]}%)`,
                              3: `3 Weeks (${interestRates[3]}%)`,
                              4: `4 Weeks (${interestRates[4]}%)`
                            };
                            return periodText[selected] || selected;
                          }}
                          onChange={(e) => setFormData({...formData, loanPeriod: e.target.value})}
                          MenuProps={{
                            PaperProps: {
                              sx: {
                                bgcolor: '#1A2B45',
                                '& .MuiMenuItem-root': {
                                  color: '#ffffff',
                                  '&:hover': { bgcolor: 'rgba(0,255,157,0.1)' },
                                  '&.Mui-selected': { bgcolor: 'rgba(0,255,157,0.2)' }
                                }
                              }
                            }
                          }}
                        >
                          <MenuItem value={1}>1 Week ({interestRates[1]}% interest)</MenuItem>
                          <MenuItem value={2}>2 Weeks ({interestRates[2]}% interest)</MenuItem>
                          <MenuItem value={3}>3 Weeks ({interestRates[3]}% interest)</MenuItem>
                          <MenuItem value={4}>4 Weeks - 1 Month ({interestRates[4]}% interest)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}

                {/* Loan Calculation Preview */}
                {loanCalculation && (
                  <Grid item xs={12}>
                    <Paper sx={{ p: 2, bgcolor: 'rgba(246,176,65,0.1)', border: '1px solid #f6b041' }}>
                      <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', color: '#f6b041' }}>
                        <Calculate sx={{ mr: 1 }} /> Loan Calculation
                      </Typography>
                      <Grid container spacing={1}>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>Principal:</strong> KSH {parseFloat(loanCalculation.principal).toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>Interest Rate:</strong> {loanCalculation.interestRate}%</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>Interest Amount:</strong> KSH {parseFloat(loanCalculation.interestAmount).toLocaleString()}</Typography>
                        </Grid>
                        <Grid item xs={6}>
                          <Typography variant="body2" sx={{ color: '#ffffff' }}><strong>Period:</strong> {loanCalculation.period}</Typography>
                        </Grid>
                        <Grid item xs={12}>
                          <Divider sx={{ my: 1, borderColor: 'rgba(246,176,65,0.3)' }} />
                          <Typography variant="h6" sx={{ color: '#00FF9D', fontWeight: 'bold' }}>
                            Total Amount Due: KSH {parseFloat(loanCalculation.totalAmount).toLocaleString()}
                          </Typography>
                        </Grid>
                      </Grid>
                    </Paper>
                  </Grid>
                )}
              </Grid>
            </DialogContent>
            <DialogActions sx={{ bgcolor: '#1A2B45', p: 2, borderTop: '1px solid rgba(0,255,157,0.2)' }}>
              <Button onClick={handleClose} sx={{ color: '#B0BEC5' }}>Cancel</Button>
              <Button
                type="submit"
                variant="contained"
                disabled={validationErrors.length > 0}
                sx={{ bgcolor: '#00FF9D', color: '#0A1628', fontWeight: 'bold', '&:hover': { bgcolor: '#00D4FF' } }}
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
  );
};

export default LoanManagement;
