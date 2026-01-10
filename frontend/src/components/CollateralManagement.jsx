import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, IconButton, AppBar, Toolbar, Select, MenuItem, FormControl,
  InputLabel, Chip, Box, Pagination
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const CollateralManagement = () => {
  const { user, logout, loading } = useAuth();
  const navigate = useNavigate();
  const [collaterals, setCollaterals] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [borrowers, setBorrowers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingCollateral, setEditingCollateral] = useState(null);
  const [formData, setFormData] = useState({
    borrowerId: '', category: '', itemName: '', modelNumber: '', serialNumber: '', itemCondition: '', status: 'held'
  });
  const [searchTerm, setSearchTerm] = useState('');

  // Redirect to login if no user
  useEffect(() => {
    if (!user) {
      navigate('/login');
    }
  }, [user, navigate]);

  const fetchCollaterals = async (page = 1) => {
    try {
      const res = await axios.get(`/api/collaterals?page=${page}&limit=10`);
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
    fetchCollaterals(value);
  };

  useEffect(() => {
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
        status: collateral.status || 'held'
      });
    } else {
      setEditingCollateral(null);
      setFormData({
        borrowerId: '', category: '', itemName: '', modelNumber: '', serialNumber: '', itemCondition: '', status: 'held'
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

  const getConditionColor = (condition) => {
    switch (condition?.toLowerCase()) {
      case 'excellent': return 'success';
      case 'good': return 'info';
      case 'fair': return 'warning';
      case 'poor': return 'error';
      default: return 'default';
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
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🏦 Core Q Capital - Collateral Management
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
          <Typography variant="h4">Collaterals</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Add Collateral
          </Button>
        </Grid>

        <TextField
          fullWidth
          label="Search Collaterals"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by item name, category, borrower, model, serial number, or condition..."
          sx={{ mb: 2 }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Borrower</TableCell>
                <TableCell>Item Name</TableCell>
                <TableCell>Category</TableCell>
                <TableCell>Condition</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredCollaterals.map((collateral) => (
                <TableRow key={collateral.id}>
                  <TableCell>{collateral.borrower?.fullName || 'N/A'}</TableCell>
                  <TableCell>{collateral.itemName}</TableCell>
                  <TableCell>{collateral.category || 'N/A'}</TableCell>
                  <TableCell>
                    <Chip label={collateral.itemCondition} color={getConditionColor(collateral.itemCondition)} />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={collateral.isSold ? 'Sold' : 'Not Sold'}
                      color={collateral.isSold ? 'error' : 'success'}
                    />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(collateral)}>
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(collateral.id)}>
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
                <Grid item xs={12} sm={6}>
                  <FormControl fullWidth required>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <MenuItem value="held">Held (With Lender)</MenuItem>
                      <MenuItem value="returned">Returned (Loan Repaid)</MenuItem>
                      <MenuItem value="seized">Seized (Defaulted)</MenuItem>
                      <MenuItem value="sold">Sold (After Seizure)</MenuItem>
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
      </Container>
    </Box>
  );
};

export default CollateralManagement;