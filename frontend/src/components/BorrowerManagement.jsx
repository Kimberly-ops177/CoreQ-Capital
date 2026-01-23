import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, IconButton, Box, Pagination, Skeleton, List, ListItem, ListItemText,
  ListItemSecondaryAction, Chip, Alert, Tabs, Tab
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import axios from 'axios';

const BorrowerManagement = () => {
  const [borrowers, setBorrowers] = useState([]);
  const [collaterals, setCollaterals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [collateralPagination, setCollateralPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [open, setOpen] = useState(false);
  const [editingBorrower, setEditingBorrower] = useState(null);
  const [loanDeleteDialogOpen, setLoanDeleteDialogOpen] = useState(false);
  const [selectedBorrowerLoans, setSelectedBorrowerLoans] = useState([]);
  const [selectedBorrowerName, setSelectedBorrowerName] = useState('');
  const [deleteError, setDeleteError] = useState('');
  const [formData, setFormData] = useState({
    fullName: '', idNumber: '', phoneNumber: '', email: '', location: '',
    apartment: '', houseNumber: '', isStudent: false, institution: '', registrationNumber: ''
  });
  const [collateralData, setCollateralData] = useState({
    itemName: '', category: '', estimatedValue: '', itemCondition: 'Good'
  });
  const [searchTerm, setSearchTerm] = useState('');
  const [loanStatusFilter, setLoanStatusFilter] = useState('all');

  const fetchBorrowers = async (page = 1, statusFilter = loanStatusFilter) => {
    try {
      setLoading(true);
      let url = `/api/borrowers?page=${page}&limit=10`;
      if (statusFilter && statusFilter !== 'all') {
        url += `&loanStatus=${statusFilter}`;
      }
      const res = await axios.get(url);
      setBorrowers(res.data.data || res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching borrowers:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchCollaterals = async (page = 1) => {
    try {
      const res = await axios.get(`/api/collaterals?page=${page}&limit=20`);
      setCollaterals(res.data.data || res.data);
      if (res.data.pagination) {
        setCollateralPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching collaterals:', err);
    }
  };

  const handlePageChange = (_event, value) => {
    fetchBorrowers(value, loanStatusFilter);
  };

  const handleTabChange = (_event, newValue) => {
    setLoanStatusFilter(newValue);
    fetchBorrowers(1, newValue);
  };

  useEffect(() => {
    fetchBorrowers(1);
    fetchCollaterals(1);
  }, []);

  const getBorrowerCollaterals = (borrowerId) => {
    return collaterals.filter(c => c.borrowerId === borrowerId);
  };

  const filteredBorrowers = borrowers.filter((borrower) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      borrower.fullName?.toLowerCase().includes(search) ||
      borrower.idNumber?.toLowerCase().includes(search) ||
      borrower.phoneNumber?.toLowerCase().includes(search) ||
      borrower.email?.toLowerCase().includes(search) ||
      borrower.location?.toLowerCase().includes(search)
    );
  });

  const handleOpen = (borrower = null) => {
    if (borrower) {
      setEditingBorrower(borrower);
      setFormData(borrower);
    } else {
      setEditingBorrower(null);
      setFormData({
        fullName: '', idNumber: '', phoneNumber: '', email: '', location: '',
        apartment: '', houseNumber: '', isStudent: false, institution: '', registrationNumber: ''
      });
      setCollateralData({
        itemName: '', category: '', estimatedValue: '', itemCondition: 'Good'
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingBorrower(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingBorrower) {
        await axios.patch(`/api/borrowers/${editingBorrower.id}`, formData);
      } else {
        // Create borrower first
        const res = await axios.post('/api/borrowers', formData);
        const newBorrowerId = res.data.id;

        // If collateral data is provided, create collateral
        if (collateralData.itemName && collateralData.estimatedValue) {
          await axios.post('/api/collaterals', {
            ...collateralData,
            borrowerId: newBorrowerId,
            isSeized: true // Collateral is held when loan is given
          });
          fetchCollaterals(collateralPagination.currentPage);
        }
      }
      fetchBorrowers(pagination.currentPage);
      handleClose();
    } catch (err) {
      console.error('Error saving borrower:', err);
      alert('Error saving borrower');
    }
  };

  // Open dialog to show borrower's loans for deletion
  const handleDeleteClick = async (borrower) => {
    try {
      setDeleteError('');
      setSelectedBorrowerName(borrower.fullName);
      // Fetch all loans for this borrower (including all statuses)
      const res = await axios.get(`/api/loans?borrowerId=${borrower.id}&limit=100`);
      const loans = res.data.data || res.data;
      setSelectedBorrowerLoans(loans);
      setLoanDeleteDialogOpen(true);
    } catch (err) {
      console.error('Error fetching borrower loans:', err);
      alert('Error fetching loans for this borrower');
    }
  };

  // Delete a specific loan
  const handleDeleteLoan = async (loanId) => {
    if (window.confirm(`Are you sure you want to delete Loan #${loanId}? This action cannot be undone.`)) {
      try {
        setDeleteError('');
        await axios.delete(`/api/loans/${loanId}`);
        // Refresh the loans list
        const updatedLoans = selectedBorrowerLoans.filter(loan => loan.id !== loanId);
        setSelectedBorrowerLoans(updatedLoans);
        // Refresh borrowers list in case loan count changed
        fetchBorrowers(pagination.currentPage);
        fetchCollaterals(collateralPagination.currentPage);
      } catch (err) {
        console.error('Error deleting loan:', err);
        setDeleteError(err.response?.data?.error || 'Error deleting loan');
      }
    }
  };

  // Delete the entire borrower (only if no loans)
  const handleDeleteBorrower = async (id) => {
    if (window.confirm('Are you sure you want to delete this borrower? This will only work if they have no loans.')) {
      try {
        await axios.delete(`/api/borrowers/${id}`);
        setLoanDeleteDialogOpen(false);
        fetchBorrowers(pagination.currentPage);
      } catch (err) {
        console.error('Error deleting borrower:', err);
        setDeleteError(err.response?.data?.error || 'Error deleting borrower. Delete all loans first.');
      }
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'paid': return 'info';
      case 'pastDue': return 'warning';
      case 'defaulted': return 'error';
      default: return 'default';
    }
  };

  return (
    <Container sx={{ py: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Borrowers</Typography>
          {/* Note: Borrowers are created through the loan application process, not directly */}
        </Grid>

        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs
            value={loanStatusFilter}
            onChange={handleTabChange}
            textColor="primary"
            indicatorColor="primary"
          >
            <Tab label="All Borrowers" value="all" />
            <Tab label="Active Loans" value="active" />
            <Tab label="Paid Loans" value="paid" />
            <Tab label="Defaulted" value="defaulted" />
          </Tabs>
        </Box>

        <TextField
          fullWidth
          label="Search Borrowers"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, ID number, phone, email, or location..."
          sx={{ mb: 2 }}
        />

        <TableContainer component={Paper} sx={{ overflowX: 'auto' }}>
          <Table sx={{ minWidth: 1200 }}>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>ID Number</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Phone</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Apartment</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>House No.</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Collateral Items</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                // Skeleton loading rows
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton animation="wave" /></TableCell>
                    <TableCell><Skeleton animation="wave" /></TableCell>
                    <TableCell><Skeleton animation="wave" /></TableCell>
                    <TableCell><Skeleton animation="wave" /></TableCell>
                    <TableCell><Skeleton animation="wave" /></TableCell>
                    <TableCell><Skeleton animation="wave" /></TableCell>
                    <TableCell><Skeleton animation="wave" /></TableCell>
                    <TableCell><Skeleton animation="wave" /></TableCell>
                    <TableCell><Skeleton animation="wave" /></TableCell>
                    <TableCell><Skeleton animation="wave" width={80} /></TableCell>
                  </TableRow>
                ))
              ) : filteredBorrowers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} align="center" sx={{ py: 4 }}>
                    <Typography color="textSecondary">No borrowers found</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                filteredBorrowers.map((borrower) => {
                  const borrowerCollaterals = getBorrowerCollaterals(borrower.id);
                  return (
                    <TableRow key={borrower.id}>
                      <TableCell>{borrower.fullName}</TableCell>
                      <TableCell>{borrower.idNumber}</TableCell>
                      <TableCell>{borrower.phoneNumber}</TableCell>
                      <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {borrower.email}
                      </TableCell>
                      <TableCell>{borrower.location}</TableCell>
                      <TableCell>{borrower.apartment || '-'}</TableCell>
                      <TableCell>{borrower.houseNumber || '-'}</TableCell>
                      <TableCell>
                        {borrower.isStudent ? (
                          <span>✓ {borrower.institution}</span>
                        ) : (
                          <span>-</span>
                        )}
                      </TableCell>
                      <TableCell>
                        {borrowerCollaterals.length > 0 ? (
                          <div>{borrowerCollaterals.map(c => c.itemName).join(', ')}</div>
                        ) : (
                          <span style={{ color: '#999' }}>No collaterals</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => handleOpen(borrower)} size="small">
                          <Edit />
                        </IconButton>
                        <IconButton onClick={() => handleDeleteClick(borrower)} size="small" title="Manage Loans">
                          <Delete />
                        </IconButton>
                      </TableCell>
                    </TableRow>
                  );
                })
              )}
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
          <DialogTitle>{editingBorrower ? 'Edit Borrower' : 'Add Borrower'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Full Name" required
                    value={formData.fullName} onChange={(e) => setFormData({...formData, fullName: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="ID Number" required
                    value={formData.idNumber} onChange={(e) => setFormData({...formData, idNumber: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Phone Number" required
                    value={formData.phoneNumber} onChange={(e) => setFormData({...formData, phoneNumber: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Email" required type="email"
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Location" required
                    value={formData.location}
                    onChange={(e) => setFormData({...formData, location: e.target.value.toUpperCase()})}
                    inputProps={{ style: { textTransform: 'uppercase' } }}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="Apartment"
                    value={formData.apartment} onChange={(e) => setFormData({...formData, apartment: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth label="House Number"
                    value={formData.houseNumber} onChange={(e) => setFormData({...formData, houseNumber: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    select fullWidth label="Is Student"
                    value={formData.isStudent} onChange={(e) => setFormData({...formData, isStudent: e.target.value === 'true'})}
                    SelectProps={{ native: true }}
                  >
                    <option value={false}>No</option>
                    <option value={true}>Yes</option>
                  </TextField>
                </Grid>
                {formData.isStudent && (
                  <>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth label="Institution"
                        value={formData.institution} onChange={(e) => setFormData({...formData, institution: e.target.value})}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth label="Registration Number"
                        value={formData.registrationNumber} onChange={(e) => setFormData({...formData, registrationNumber: e.target.value})}
                      />
                    </Grid>
                  </>
                )}

                {!editingBorrower && (
                  <>
                    <Grid item xs={12}>
                      <Typography variant="h6" sx={{ mt: 2, mb: 1, color: '#F57F17' }}>
                        Collateral Information (Optional)
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth label="Item Name"
                        value={collateralData.itemName}
                        onChange={(e) => setCollateralData({...collateralData, itemName: e.target.value})}
                        placeholder="e.g., Laptop, Phone, etc."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth label="Category"
                        value={collateralData.category}
                        onChange={(e) => setCollateralData({...collateralData, category: e.target.value})}
                        placeholder="e.g., Electronics, Jewelry, etc."
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth label="Estimated Value (KSH)" type="number"
                        value={collateralData.estimatedValue}
                        onChange={(e) => setCollateralData({...collateralData, estimatedValue: e.target.value})}
                        placeholder="Enter amount"
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        select fullWidth label="Condition"
                        value={collateralData.itemCondition}
                        onChange={(e) => setCollateralData({...collateralData, itemCondition: e.target.value})}
                        SelectProps={{ native: true }}
                      >
                        <option value="Excellent">Excellent</option>
                        <option value="Good">Good</option>
                        <option value="Fair">Fair</option>
                        <option value="Poor">Poor</option>
                      </TextField>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingBorrower ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>

        {/* Loan Deletion Dialog */}
        <Dialog open={loanDeleteDialogOpen} onClose={() => setLoanDeleteDialogOpen(false)} maxWidth="md" fullWidth>
          <DialogTitle>Manage Loans for {selectedBorrowerName}</DialogTitle>
          <DialogContent>
            {deleteError && (
              <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>
            )}
            {selectedBorrowerLoans.length === 0 ? (
              <Typography color="textSecondary" sx={{ py: 2 }}>
                No loans found for this borrower.
              </Typography>
            ) : (
              <>
                <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                  Click the delete button next to a specific loan to remove it. The borrower and other loans will remain.
                </Typography>
                <List>
                  {selectedBorrowerLoans.map((loan) => (
                    <ListItem
                      key={loan.id}
                      sx={{
                        border: '1px solid #e0e0e0',
                        borderRadius: 1,
                        mb: 1,
                        bgcolor: loan.status === 'defaulted' ? 'rgba(255,77,106,0.1)' : 'inherit'
                      }}
                    >
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography fontWeight="bold">Loan #{loan.id}</Typography>
                            <Chip label={loan.status} color={getStatusColor(loan.status)} size="small" />
                          </Box>
                        }
                        secondary={
                          <>
                            Amount: KSH {parseFloat(loan.amountIssued).toLocaleString()} |
                            Total: KSH {parseFloat(loan.totalAmount).toLocaleString()} |
                            Due: {new Date(loan.dueDate).toLocaleDateString()} |
                            Issued: {new Date(loan.dateIssued).toLocaleDateString()}
                          </>
                        }
                      />
                      <ListItemSecondaryAction>
                        <IconButton
                          edge="end"
                          onClick={() => handleDeleteLoan(loan.id)}
                          color="error"
                          title="Delete this loan"
                        >
                          <Delete />
                        </IconButton>
                      </ListItemSecondaryAction>
                    </ListItem>
                  ))}
                </List>
              </>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setLoanDeleteDialogOpen(false)}>Close</Button>
            {selectedBorrowerLoans.length === 0 && (
              <Button
                color="error"
                variant="contained"
                onClick={() => {
                  const borrower = borrowers.find(b => b.fullName === selectedBorrowerName);
                  if (borrower) handleDeleteBorrower(borrower.id);
                }}
              >
                Delete Borrower
              </Button>
            )}
          </DialogActions>
        </Dialog>
      </Container>
  );
};

export default BorrowerManagement;
