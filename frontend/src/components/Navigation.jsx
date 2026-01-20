import React from 'react';
import {
  AppBar, Toolbar, Typography, Button, Box, IconButton
} from '@mui/material';
import { ArrowBack } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const Navigation = ({ title, showBack = true }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(-1); // Go back to previous page
  };

  const getDashboardPath = () => {
    return user?.role === 'admin' ? '/admin' : '/employee';
  };

  return (
    <AppBar position="static">
      <Toolbar>
        {/* Back Button */}
        {showBack && (
          <IconButton
            color="inherit"
            onClick={handleBack}
            sx={{ mr: 2 }}
            aria-label="Go back"
          >
            <ArrowBack />
          </IconButton>
        )}

        {/* Page Title */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', minWidth: 'fit-content' }}>
          {title || 'Core Q Capital'}
        </Typography>

        {/* Spacer */}
        <Box sx={{ flexGrow: 1 }} />

        {/* Navigation Links - Right aligned */}
        <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 0.5 }}>
          <Button color="inherit" size="small" onClick={() => navigate(getDashboardPath())}>
            Dashboard
          </Button>
          <Button color="inherit" size="small" onClick={() => navigate('/borrowers')}>
            Borrowers
          </Button>
          <Button color="inherit" size="small" onClick={() => navigate('/loans')}>
            Loans
          </Button>
          <Button color="inherit" size="small" onClick={() => navigate('/agreements')}>
            Agreements
          </Button>
          <Button color="inherit" size="small" onClick={() => navigate('/collaterals')}>
            Collaterals
          </Button>
          <Button color="inherit" size="small" onClick={() => navigate('/expenses')}>
            Expenses
          </Button>
          <Button color="inherit" size="small" onClick={() => navigate('/reports')}>
            Reports
          </Button>
          {user?.role === 'admin' && (
            <Button color="inherit" size="small" onClick={() => navigate('/settings')}>
              Settings
            </Button>
          )}
          {user?.role === 'admin' && (
            <Button color="inherit" size="small" onClick={() => navigate('/users')}>
              Users
            </Button>
          )}
          <Button color="inherit" size="small" onClick={logout}>
            Logout
          </Button>
        </Box>

        {/* Mobile - Just show back and logout */}
        <Box sx={{ display: { xs: 'flex', md: 'none' }, gap: 1 }}>
          <Button color="inherit" size="small" onClick={() => navigate(getDashboardPath())}>
            Home
          </Button>
          <Button color="inherit" size="small" onClick={logout}>
            Logout
          </Button>
        </Box>
      </Toolbar>
    </AppBar>
  );
};

export default Navigation;
