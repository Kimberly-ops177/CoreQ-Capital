import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, IconButton, AppBar, Toolbar, Box, Pagination, Select, MenuItem,
  FormControl, InputLabel
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const ExpenseManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [expenses, setExpenses] = useState([]);
  const [pagination, setPagination] = useState({ currentPage: 1, totalPages: 1, totalItems: 0 });
  const [open, setOpen] = useState(false);
  const [editingExpense, setEditingExpense] = useState(null);
  const [formData, setFormData] = useState({
    category: '', name: '', date: new Date().toISOString().split('T')[0], amount: ''
  });

  const canAddExpense = user.role === 'admin' || (user.role === 'employee' && user.permissions?.canAddExpense);
  const canViewAllExpenses = user.role === 'admin';

  const fetchExpenses = async (page = 1) => {
    try {
      const res = await axios.get(`/api/expenses?page=${page}&limit=10`);
      setExpenses(res.data.data || res.data);
      if (res.data.pagination) {
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Error fetching expenses:', err);
    }
  };

  const handlePageChange = (_event, value) => {
    fetchExpenses(value);
  };

  useEffect(() => {
    fetchExpenses(1);
  }, []);

  const handleOpen = (expense = null) => {
    if (expense) {
      setEditingExpense(expense);
      setFormData({
        category: expense.category,
        name: expense.name,
        date: new Date(expense.date).toISOString().split('T')[0],
        amount: expense.amount
      });
    } else {
      setEditingExpense(null);
      setFormData({
        category: '', name: '', date: new Date().toISOString().split('T')[0], amount: ''
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingExpense(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingExpense) {
        await axios.patch(`/api/expenses/${editingExpense.id}`, formData);
      } else {
        await axios.post('/api/expenses', formData);
      }
      fetchExpenses(pagination.currentPage);
      handleClose();
    } catch (err) {
      console.error('Error saving expense:', err);
      alert('Error saving expense');
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this expense?')) {
      try {
        await axios.delete(`/api/expenses/${id}`);
        fetchExpenses(pagination.currentPage);
      } catch (err) {
        console.error('Error deleting expense:', err);
        alert('Error deleting expense');
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh',  }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🏦 Core Q Capital - Expense Management
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
          <Typography variant="h4">Expenses</Typography>
          {canAddExpense && (
            <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
              Add Expense
            </Button>
          )}
        </Grid>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Category</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Added By</TableCell>
                {canViewAllExpenses && <TableCell>Actions</TableCell>}
              </TableRow>
            </TableHead>
            <TableBody>
              {expenses.map((expense) => (
                <TableRow key={expense.id}>
                  <TableCell>{expense.category}</TableCell>
                  <TableCell>{expense.name}</TableCell>
                  <TableCell>{new Date(expense.date).toLocaleDateString()}</TableCell>
                  <TableCell>Ksh {expense.amount.toLocaleString()}</TableCell>
                  <TableCell>{expense.user?.name || 'N/A'}</TableCell>
                  {canViewAllExpenses && (
                    <TableCell>
                      <IconButton onClick={() => handleOpen(expense)}>
                        <Edit />
                      </IconButton>
                      <IconButton onClick={() => handleDelete(expense.id)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  )}
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

        {canAddExpense && (
          <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>{editingExpense ? 'Edit Expense' : 'Add Expense'}</DialogTitle>
            <form onSubmit={handleSubmit}>
              <DialogContent>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <FormControl fullWidth required>
                      <InputLabel>Category</InputLabel>
                      <Select
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        label="Category"
                      >
                        <MenuItem value="Rent">Rent</MenuItem>
                        <MenuItem value="Salary">Salary</MenuItem>
                        <MenuItem value="Printing">Printing</MenuItem>
                        <MenuItem value="Others">Others</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth
                      label="Name / Description"
                      required
                      placeholder="e.g., Office Rent January, John Doe Salary, Business Cards"
                      helperText="Provide a specific description of this expense"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Date" required type="date"
                      value={formData.date} onChange={(e) => setFormData({...formData, date: e.target.value})}
                      InputLabelProps={{ shrink: true }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Amount (Ksh)" required type="number" step="0.01"
                      value={formData.amount} onChange={(e) => setFormData({...formData, amount: e.target.value})}
                    />
                  </Grid>
                </Grid>
              </DialogContent>
              <DialogActions>
                <Button onClick={handleClose}>Cancel</Button>
                <Button type="submit" variant="contained">
                  {editingExpense ? 'Update' : 'Add'}
                </Button>
              </DialogActions>
            </form>
          </Dialog>
        )}
      </Container>
    </Box>
  );
};

export default ExpenseManagement;