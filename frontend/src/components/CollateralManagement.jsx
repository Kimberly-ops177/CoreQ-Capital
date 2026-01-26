import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, IconButton, Select, MenuItem, FormControl,
  InputLabel, Chip, Box, Pagination, Tabs, Tab
} from '@mui/material';
import { Edit, Delete, Sell } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CollateralManagement = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [collaterals, setCollaterals] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [borrowers, setBorrowers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCollateral, setEditingCollateral] = useState(null);
  const [formData, setFormData] = useState({
    borrowerId: '', category: '', itemName: '', modelNumber: '', serialNumber: '', itemCondition: '', isSold: false
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [borrowerIdFilter, setBorrowerIdFilter] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('all');

  // Mark as Sold dialog state
  const [soldDialogOpen, setSoldDialogOpen] = useState(false);
  const [selectedCollateral, setSelectedCollateral] = useState(null);
  const [loanDetails, setLoanDetails] = useState(null);
  const [soldFormData, setSoldFormData] = useState({
    soldPrice: '',
    soldDate: new Date().toISOString().split('T')[0],
    amountIssued: '',
    amountPayable: ''
  });

  // Redirect to login if no user
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchCollaterals = async (page = 1, idFilter = '', statusFilter = 'all') => {
    try {
      let url = `/api/collaterals?page=${page}&limit=10`;
      if (idFilter) {
        url += `&borrowerIdNumber=${encodeURIComponent(idFilter)}`;
      }
      if (statusFilter && statusFilter !== 'all') {
        url += `&loanStatus=${encodeURIComponent(statusFilter)}`;
      }
      const res = await axios.get(url);
      setCollaterals(res.data.data || res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching collaterals:', err);
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

  const handlePageChange = (_event, value) => {
    fetchCollaterals(value, borrowerIdFilter, loanStatusFilter);
  };

  const handleBorrowerIdFilterChange = (e) => {
    setBorrowerIdFilter(e.target.value);
  };

  const handleFilterByBorrowerId = () => {
    fetchCollaterals(1, borrowerIdFilter, loanStatusFilter);
  };

  const handleClearFilter = () => {
    setBorrowerIdFilter('');
    fetchCollaterals(1, '', loanStatusFilter);
  };

  const handleTabChange = (_event, newValue) => {
    setLoanStatusFilter(newValue);
    fetchCollaterals(1, borrowerIdFilter, newValue);
  };

  useEffect(() => {
    console.log('CollateralManagement mounted');
    fetchCollaterals(1);
    fetchBorrowers();
  }, []);

  const filteredCollaterals = collaterals.filter((collateral) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      collateral.itemName?.toLowerCase().includes(search) ||
      collateral.category?.toLowerCase().includes(search) ||
      collateral.borrower?.fullName?.toLowerCase().includes(search) ||
      collateral.modelNumber?.toLowerCase().includes(search) ||
      collateral.serialNumber?.toLowerCase().includes(search) ||
      collateral.itemCondition?.toLowerCase().includes(search)
    );
  });

  const handleOpen = (collateral = null) => {
    if (collateral) {
      setEditingCollateral(collateral);
      setFormData({
        borrowerId: collateral.borrower?.id || '',
        category: collateral.category || '',
        itemName: collateral.itemName,
        modelNumber: collateral.modelNumber || '',
        serialNumber: collateral.serialNumber || '',
        itemCondition: collateral.itemCondition,
        isSold: collateral.isSold || false
      });
    } else {
      setEditingCollateral(null);
      setFormData({
        borrowerId: '', category: '', itemName: '', modelNumber: '', serialNumber: '', itemCondition: '', isSold: false
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingCollateral(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingCollateral) {
        await axios.patch(`/api/collaterals/${editingCollateral.id}`, formData);
      } else {
        await axios.post('/api/collaterals', formData);
      }
      fetchCollaterals(pagination.currentPage);
      handleClose();
    } catch (err) {
      console.error('Error saving collateral:', err);
      alert('Error saving collateral');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this collateral?')) {
      try {
        await axios.delete(`/api/collaterals/${id}`);
        fetchCollaterals(pagination.currentPage);
      } catch (err) {
        console.error('Error deleting collateral:', err);
        alert('Error deleting collateral');
      }
    }
  };

  // Mark as Sold handlers
  const handleOpenSoldDialog = async (collateral) => {
    setSelectedCollateral(collateral);
    setLoanDetails(null);

    // Fetch the loan details for this collateral to get amount issued and amount payable
    try {
      const res = await axios.get(`/api/loans?collateralId=${collateral.id}&limit=1`);
      const loans = res.data.data || res.data;
      if (loans && loans.length > 0) {
        const loan = loans[0];
        setLoanDetails(loan);
        setSoldFormData({
          soldPrice: '',
          soldDate: new Date().toISOString().split('T')[0],
          amountIssued: loan.amountIssued || '',
          amountPayable: loan.totalAmount || ''
        });
      } else {
        setSoldFormData({
          soldPrice: '',
          soldDate: new Date().toISOString().split('T')[0],
          amountIssued: '',
          amountPayable: ''
        });
      }
    } catch (err) {
      console.error('Error fetching loan details:', err);
      setSoldFormData({
        soldPrice: '',
        soldDate: new Date().toISOString().split('T')[0],
        amountIssued: '',
        amountPayable: ''
      });
    }

    setSoldDialogOpen(true);
  };

  const handleCloseSoldDialog = () => {
    setSoldDialogOpen(false);
    setSelectedCollateral(null);
    setLoanDetails(null);
  };

  const handleMarkAsSold = async (e) => {
    e.preventDefault();
    if (!selectedCollateral) return;

    try {
      await axios.post(`/api/collaterals/${selectedCollateral.id}/mark-sold`, {
        soldPrice: parseFloat(soldFormData.soldPrice),
        soldDate: soldFormData.soldDate,
        amountIssued: parseFloat(soldFormData.amountIssued),
        amountPayable: parseFloat(soldFormData.amountPayable)
      });
      fetchCollaterals(pagination.currentPage);
      handleCloseSoldDialog();
      alert('Collateral marked as sold successfully');
    } catch (err) {
      console.error('Error marking collateral as sold:', err);
      alert(err.response?.data?.message || err.response?.data?.error || 'Error marking collateral as sold');
    }
  };

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
    }
  };

  const getStatusColor = (isSold) => {
    return isSold ? 'error' : 'primary';
  };

  const getStatusLabel = (isSold) => {
    return isSold ? 'Sold' : 'Not Sold';
  };

  // Get the first loan ID for a collateral
  const getLoanId = (collateral) => {
    if (collateral.loans && collateral.loans.length > 0) {
      return collateral.loans[0].id;
    }
    return 'N/A';
  };

  // Loan status badge helpers
  const getLoanStatusColor = (status) => {
    switch (status) {
      case 'active': return 'primary';
      case 'pastDue': return 'warning';
      case 'defaulted': return 'error';
      case 'paid': return 'success';
      default: return 'default';
    }
  };

  const getLoanStatusLabel = (collateral) => {
    if (collateral.isSold) {
      return 'Sold';
    }

    const status = collateral.loanStatus;
    const daysOverdue = collateral.daysOverdue || 0;

    switch (status) {
      case 'active': return 'Active';
      case 'pastDue': return `Past Due (${daysOverdue} day${daysOverdue !== 1 ? 's' : ''})`;
      case 'defaulted': return 'Defaulted';
      case 'paid': return 'Paid';
      default: return 'Unknown';
    }
  };

  // Show loading while user data is being fetched
  if (loading) {
    return null;
  }

  if (!user) {
    return null;
  }

  return (
    <Container sx={{ py: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Collaterals</Typography>
          {/* Note: Collaterals are added through the loan application process */}
        </Grid>

        {/* Loan Status Filter Tabs */}
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
          <Tabs value={loanStatusFilter} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
            <Tab label="All Items" value="all" />
            <Tab label="Active" value="active" />
            <Tab label="Past Due" value="pastDue" />
            <Tab label="Paid" value="paid" />
            <Tab label="Defaulted" value="defaulted" />
            <Tab label="Defaulted - Unsold" value="defaultedUnsold" />
            <Tab label="Sold" value="sold" />
          </Tabs>
        </Box>

        <Grid container spacing={2} sx={{ mb: 2 }}>
          <Grid item xs={12} sm={6}>
            <TextField
              fullWidth
              label="Search Collaterals"
              variant="outlined"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search by item name, category, borrower..."
            />
          </Grid>
          <Grid item xs={12} sm={4}>
            <TextField
              fullWidth
              label="Filter by Borrower ID Number"
              variant="outlined"
              value={borrowerIdFilter}
              onChange={handleBorrowerIdFilterChange}
              placeholder="Enter Borrower ID Number..."
              onKeyPress={(e) => e.key === 'Enter' && handleFilterByBorrowerId()}
            />
          </Grid>
          <Grid item xs={12} sm={2}>
            <Box sx={{ display: 'flex', gap: 1, height: '100%' }}>
              <Button
                variant="contained"
                onClick={handleFilterByBorrowerId}
                sx={{ flex: 1 }}
              >
                Filter
              </Button>
              <Button
                variant="outlined"
                onClick={handleClearFilter}
                sx={{ flex: 1 }}
              >
                Clear
              </Button>
            </Box>
          </Grid>
        </Grid>

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Loan ID</TableCell>
                <TableCell>Borrower</TableCell>
                <TableCell>Borrower ID No.</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Loan Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCollaterals.map((collateral) => (
                <TableRow key={collateral.id}>
                  <TableCell>{getLoanId(collateral)}</TableCell>
                  <TableCell>{collateral.borrower?.fullName || 'N/A'}</TableCell>
                  <TableCell>{collateral.borrower?.idNumber || 'N/A'}</TableCell>
                  <TableCell>{collateral.itemName}</TableCell>
                  <TableCell>{collateral.category || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={collateral.itemCondition} color={getConditionColor(collateral.itemCondition)} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={getLoanStatusLabel(collateral)}
                      color={collateral.isSold ? 'default' : getLoanStatusColor(collateral.loanStatus)}
                      sx={collateral.isSold ? { bgcolor: 'grey.400', color: 'white' } : {}}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(collateral)} title="Edit">
                      <Edit />
                    </IconButton>
                    {!collateral.isSold && user?.role === 'admin' && (
                      <IconButton onClick={() => handleOpenSoldDialog(collateral)} title="Mark as Sold" color="success">
                        <Sell />
                      </IconButton>
                    )}
                    <IconButton onClick={() => handleDelete(collateral.id)} title="Delete">
                      <Delete />
                    </IconButton>
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

        <Dialog open={open} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>{editingCollateral ? 'Edit Collateral' : 'Add Collateral'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Borrower</InputLabel>
                    <Select
                      value={formData.borrowerId}
                      onChange={(e) => setFormData({...formData, borrowerId: e.target.value})}
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
                  <TextField
                    fullWidth label="Category" required
                    value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Item Name" required
                    value={formData.itemName} onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Model Number"
                    value={formData.modelNumber} onChange={(e) => setFormData({...formData, modelNumber: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Serial Number"
                    value={formData.serialNumber} onChange={(e) => setFormData({...formData, serialNumber: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Condition</InputLabel>
                    <Select
                      value={formData.itemCondition}
                      onChange={(e) => setFormData({...formData, itemCondition: e.target.value})}
                    >
                      <MenuItem value="Excellent">Excellent</MenuItem>
                      <MenuItem value="Good">Good</MenuItem>
                      <MenuItem value="Fair">Fair</MenuItem>
                      <MenuItem value="Poor">Poor</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingCollateral ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Mark as Sold Dialog */}
        <Dialog open={soldDialogOpen} onClose={handleCloseSoldDialog} maxWidth="md" fullWidth>
          <DialogTitle sx={{ bgcolor: 'success.main', color: 'white' }}>
            Mark Collateral as Sold
          </DialogTitle>
          <form onSubmit={handleMarkAsSold}>
            <DialogContent>
              {selectedCollateral && (
                <>
                  {/* Prefilled Borrower & Item Details (Read-only) */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mt: 1, mb: 1, color: 'primary.main' }}>
                    Borrower Details (Prefilled)
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Borrower Name"
                        value={selectedCollateral.borrower?.fullName || 'N/A'}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="ID Number"
                        value={selectedCollateral.borrower?.idNumber || 'N/A'}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Phone Number"
                        value={selectedCollateral.borrower?.phoneNumber || 'N/A'}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Item ID"
                        value={selectedCollateral.id || 'N/A'}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                      />
                    </Grid>
                  </Grid>

                  {/* Prefilled Item Details (Read-only) */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                    Item Details (Prefilled)
                  </Typography>
                  <Grid container spacing={2} sx={{ mb: 3 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Item Name"
                        value={selectedCollateral.itemName || 'N/A'}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Model Number"
                        value={selectedCollateral.modelNumber || 'N/A'}
                        InputProps={{ readOnly: true }}
                        variant="filled"
                      />
                    </Grid>
                  </Grid>

                  {/* Editable Sale Details */}
                  <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1, color: 'success.main' }}>
                    Sale Details (Enter Below)
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount Issued (KES)"
                        type="number"
                        required
                        value={soldFormData.amountIssued}
                        onChange={(e) => setSoldFormData({...soldFormData, amountIssued: e.target.value})}
                        inputProps={{ min: 0, step: 0.01 }}
                        helperText="Original loan principal amount"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount Payable (KES)"
                        type="number"
                        required
                        value={soldFormData.amountPayable}
                        onChange={(e) => setSoldFormData({...soldFormData, amountPayable: e.target.value})}
                        inputProps={{ min: 0, step: 0.01 }}
                        helperText="Total amount due (principal + interest)"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Amount Sold For (KES)"
                        type="number"
                        required
                        value={soldFormData.soldPrice}
                        onChange={(e) => setSoldFormData({...soldFormData, soldPrice: e.target.value})}
                        inputProps={{ min: 0, step: 0.01 }}
                        helperText="Actual sale price of the item"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        label="Date Sold"
                        type="date"
                        required
                        value={soldFormData.soldDate}
                        onChange={(e) => setSoldFormData({...soldFormData, soldDate: e.target.value})}
                        InputLabelProps={{ shrink: true }}
                        helperText="Date the item was sold"
                      />
                    </Grid>
                  </Grid>
                </>
              )}
            </DialogContent>
            <DialogActions sx={{ p: 2 }}>
              <Button onClick={handleCloseSoldDialog} variant="outlined">Cancel</Button>
              <Button type="submit" variant="contained" color="success">
                Confirm Sale
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
  );
};

export default CollateralManagement;
