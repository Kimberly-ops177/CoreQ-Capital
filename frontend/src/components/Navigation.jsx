import React from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box
} from '@mui/material';
import { ArrowBack, Add } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = ({ title, showBack = true, isDashboard = false }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const getDashboardPath = () => {
    return user?.role === 'admin' ? '/admin' : '/employee';
  };

  // Dashboard layout - Clean title on left, New Loan button, then navigation
  if (isDashboard) {
    return (
      <AppBar position="static">
        <Toolbar>
          {/* Dashboard Title */}
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            {title || 'Core Q Capital'}
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button variant="contained" color="success" startIcon={<Add />} onClick={() => navigate('/new-loan')}>
              New Loan
            </Button>
            <Button color="inherit" onClick={() => navigate('/borrowers')}>Borrowers</Button>
            <Button color="inherit" onClick={() => navigate('/loans')}>Loans</Button>
            <Button color="inherit" onClick={() => navigate('/agreements')}>Agreements</Button>
            <Button color="inherit" onClick={() => navigate('/collaterals')}>Collaterals</Button>
            <Button color="inherit" onClick={() => navigate('/expenses')}>Expenses</Button>
            <Button color="inherit" onClick={() => navigate('/reports')}>Reports</Button>
            {user?.role === 'admin' && (
              <Button color="inherit" onClick={() => navigate('/settings')}>Settings</Button>
            )}
            {user?.role === 'admin' && (
              <Button color="inherit" onClick={() => navigate('/users')}>Users</Button>
            )}
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Box>

          {/* Mobile */}
          <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
            <Button variant="contained" color="success" size="small" startIcon={<Add />} onClick={() => navigate('/new-loan')}>
              New
            </Button>
            <Button color="inherit" onClick={logout}>Logout</Button>
          </Box>
        </Toolbar>
      </AppBar>
    );
  }

  // Other pages layout - Back button on left, title, navigation on right
  return (
    <AppBar position="static">
      <Toolbar>
        {/* Back Button */}
        {showBack && (
          <Button
            color="inherit"
            onClick={handleBack}
            startIcon={<ArrowBack />}
            sx={{ mr: 2 }}
          >
            Back
          </Button>
        )}

        {/* Page Title */}
        <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
          {title || 'Core Q Capital'}
        </Typography>

        {/* Desktop Navigation - Right aligned */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
          <Button color="inherit" onClick={() => navigate(getDashboardPath())}>Dashboard</Button>
          <Button color="inherit" onClick={() => navigate('/borrowers')}>Borrowers</Button>
          <Button color="inherit" onClick={() => navigate('/loans')}>Loans</Button>
          <Button color="inherit" onClick={() => navigate('/agreements')}>Agreements</Button>
          <Button color="inherit" onClick={() => navigate('/collaterals')}>Collaterals</Button>
          <Button color="inherit" onClick={() => navigate('/expenses')}>Expenses</Button>
          <Button color="inherit" onClick={() => navigate('/reports')}>Reports</Button>
          {user?.role === 'admin' && (
            <Button color="inherit" onClick={() => navigate('/settings')}>Settings</Button>
          )}
          {user?.role === 'admin' && (
            <Button color="inherit" onClick={() => navigate('/users')}>Users</Button>
          )}
          <Button color="inherit" onClick={logout}>Logout</Button>
        </Box>

        {/* Mobile */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
          <Button color="inherit" size="small" onClick={() => navigate(getDashboardPath())}>Home</Button>
          <Button color="inherit" size="small" onClick={logout}>Logout</Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
