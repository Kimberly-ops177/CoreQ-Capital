import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Dialog, DialogTitle, DialogContent, DialogActions,
  TextField, Grid, IconButton, AppBar, Toolbar, Select, MenuItem, FormControl,
  InputLabel, Chip, Box
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const UserManagement = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [users, setUsers] = useState([]);
  const [open, setOpen] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', role: 'employee',
    assignedLocation: '',
    permissions: {
      // Employee permissions based on instructions document
      canAddBorrowers: true,          // Can register borrowers
      canAddCollaterals: true,         // Can log collateral
      canIssueLoans: true,             // Can issue loans
      canAddExpenses: false            // Optional - can be granted by admin
    }
  });
  const [searchTerm, setSearchTerm] = useState('');

  const fetchUsers = async () => {
    try {
      const res = await axios.get('/api/users');
      setUsers(res.data);
    } catch (err) {
      console.error('Error fetching users:', err);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter((usr) => {
    if (!searchTerm) return true;
    const search = searchTerm.toLowerCase();
    return (
      usr.name?.toLowerCase().includes(search) ||
      usr.email?.toLowerCase().includes(search) ||
      usr.role?.toLowerCase().includes(search) ||
      usr.assignedLocation?.toLowerCase().includes(search)
    );
  });

  const handleOpen = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name,
        email: user.email,
        password: '',
        role: user.role,
        assignedLocation: user.assignedLocation || '',
        permissions: {
          canAddBorrowers: user.permissions?.canAddBorrowers ?? true,
          canAddCollaterals: user.permissions?.canAddCollaterals ?? true,
          canIssueLoans: user.permissions?.canIssueLoans ?? true,
          canAddExpenses: user.permissions?.canAddExpenses ?? false,
          ...user.permissions
        }
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '', email: '', password: '', role: 'employee',
        assignedLocation: '',
        permissions: {
          canAddBorrowers: true,
          canAddCollaterals: true,
          canIssueLoans: true,
          canAddExpenses: false
        }
      });
    }
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setEditingUser(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingUser) {
        await axios.patch(`/api/users/${editingUser.id}`, formData);
      } else {
        await axios.post('/api/auth/register', formData);
      }
      fetchUsers();
      handleClose();
    } catch (err) {
      console.error('Error saving user:', err);
      alert('Error saving user: ' + (err.response?.data?.error || err.message));
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this user?')) {
      try {
        await axios.delete(`/api/users/${id}`);
        fetchUsers();
      } catch (err) {
        console.error('Error deleting user:', err);
        alert('Error deleting user: ' + (err.response?.data?.error || err.message));
      }
    }
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🏦 Core Q Capital - User Management
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button color="inherit" onClick={() => navigate('/admin')}>Dashboard</Button>
            <Button color="inherit" onClick={() => navigate('/borrowers')}>Borrowers</Button>
            <Button color="inherit" onClick={() => navigate('/loans')}>Loans</Button>
            <Button color="inherit" onClick={() => navigate('/collaterals')}>Collaterals</Button>
            <Button color="inherit" onClick={() => navigate('/expenses')}>Expenses</Button>
            <Button color="inherit" onClick={() => navigate('/reports')}>Reports</Button>
            <Button color="inherit" onClick={() => navigate('/settings')}>Settings</Button>
            <Button color="inherit" onClick={() => navigate('/users')}>Users</Button>
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Box>
          <Box sx={{ display: { xs: 'flex', md: 'none' } }}>
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>
      <Container sx={{ mt: 4, mb: 4 }}>
        <Grid container justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
          <Typography variant="h4">Users</Typography>
          <Button variant="contained" startIcon={<Add />} onClick={() => handleOpen()}>
            Add User
          </Button>
        </Grid>

        <TextField
          fullWidth
          label="Search Users"
          variant="outlined"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by name, email, role, or assigned location..."
          sx={{ mb: 2 }}
        />

        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Name</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Email</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Role</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Assigned Location</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Permissions</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredUsers.map((usr) => (
                <TableRow key={usr.id}>
                  <TableCell>{usr.name}</TableCell>
                  <TableCell>{usr.email}</TableCell>
                  <TableCell>
                    <Chip label={usr.role} color={usr.role === 'admin' ? 'primary' : 'default'} />
                  </TableCell>
                  <TableCell>
                    {usr.role === 'admin' ? (
                      <Chip label="All Locations" color="primary" size="small" />
                    ) : (
                      usr.assignedLocation || <span style={{ color: '#999' }}>Not Assigned</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      {usr.role === 'admin' ? (
                        <>
                          <Chip label="Full Access" size="small" color="success" />
                          <Chip label="All Branches" size="small" color="primary" />
                        </>
                      ) : (
                        <>
                          {usr.assignedLocation && <Chip label={`${usr.assignedLocation} Only`} size="small" color="warning" />}
                          {usr.permissions?.canAddBorrowers && <Chip label="Register Borrowers" size="small" color="info" />}
                          {usr.permissions?.canAddCollaterals && <Chip label="Log Collateral" size="small" color="info" />}
                          {usr.permissions?.canIssueLoans && <Chip label="Issue Loans" size="small" color="info" />}
                          {usr.permissions?.canAddExpenses && <Chip label="Add Expenses" size="small" color="secondary" />}
                        </>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Chip label={usr.isActive ? 'Active' : 'Inactive'} color={usr.isActive ? 'success' : 'error'} />
                  </TableCell>
                  <TableCell>
                    <IconButton onClick={() => handleOpen(usr)} size="small">
                      <Edit />
                    </IconButton>
                    <IconButton onClick={() => handleDelete(usr.id)} size="small">
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>{editingUser ? 'Edit User' : 'Add User'}</DialogTitle>
          <form onSubmit={handleSubmit}>
            <DialogContent>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Name" required
                    value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth label="Email" required type="email"
                    value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                  />
                </Grid>
                {!editingUser && (
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Password" required type="password"
                      value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                    />
                  </Grid>
                )}
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Role</InputLabel>
                    <Select
                      value={formData.role}
                      onChange={(e) => setFormData({...formData, role: e.target.value})}
                    >
                      <MenuItem value="employee">Employee</MenuItem>
                      <MenuItem value="admin">Admin</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                {formData.role === 'employee' && (
                  <>
                    <Grid item xs={12}>
                      <TextField
                        fullWidth label="Assigned Location" required
                        value={formData.assignedLocation}
                        onChange={(e) => setFormData({...formData, assignedLocation: e.target.value})}
                        placeholder="e.g., Nairobi, Kisumu, Mombasa"
                        helperText="Employee can only view/edit borrowers from this location"
                      />
                    </Grid>
                    <Grid item xs={12}>
                      <Typography variant="subtitle2" sx={{ mb: 1, mt: 1, fontWeight: 'bold', color: '#F57F17' }}>
                        Employee Permissions
                      </Typography>
                    </Grid>

                    {/* Permission to Add Borrowers */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Allow Registering Borrowers</InputLabel>
                        <Select
                          value={formData.permissions.canAddBorrowers}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: {...formData.permissions, canAddBorrowers: e.target.value === 'true'}
                          })}
                        >
                          <MenuItem value={false}>No</MenuItem>
                          <MenuItem value={true}>Yes (Default)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Permission to Add Collaterals */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Allow Logging Collateral</InputLabel>
                        <Select
                          value={formData.permissions.canAddCollaterals}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: {...formData.permissions, canAddCollaterals: e.target.value === 'true'}
                          })}
                        >
                          <MenuItem value={false}>No</MenuItem>
                          <MenuItem value={true}>Yes (Default)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Permission to Issue Loans */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Allow Issuing Loans</InputLabel>
                        <Select
                          value={formData.permissions.canIssueLoans}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: {...formData.permissions, canIssueLoans: e.target.value === 'true'}
                          })}
                        >
                          <MenuItem value={false}>No</MenuItem>
                          <MenuItem value={true}>Yes (Default)</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>

                    {/* Permission to Add Expenses - OPTIONAL */}
                    <Grid item xs={12} sm={6}>
                      <FormControl fullWidth>
                        <InputLabel>Allow Adding Expenses (Optional)</InputLabel>
                        <Select
                          value={formData.permissions.canAddExpenses}
                          onChange={(e) => setFormData({
                            ...formData,
                            permissions: {...formData.permissions, canAddExpenses: e.target.value === 'true'}
                          })}
                        >
                          <MenuItem value={false}>No (Default)</MenuItem>
                          <MenuItem value={true}>Yes</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </>
                )}
              </Grid>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Cancel</Button>
              <Button type="submit" variant="contained">
                {editingUser ? 'Update' : 'Add'}
              </Button>
            </DialogActions>
          </form>
        </Dialog>
      </Container>
    </Box>
  );
};

export default UserManagement;