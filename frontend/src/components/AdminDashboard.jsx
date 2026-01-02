import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, Button, AppBar, Toolbar, Box } from '@mui/material';
import { Add } from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const AdminDashboard = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({});

  useEffect(() => {
    axios.get('/api/financial/dashboard/admin').then(res => setData(res.data));
  }, []);

  return (
    <Box sx={{
      minHeight: '100vh'
    }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🏦 Core Q Capital - Admin Dashboard
          </Typography>
          <Box sx={{ display: { xs: 'none', md: 'flex' }, gap: 1 }}>
            <Button variant="contained" color="success" startIcon={<Add />} onClick={() => navigate('/new-loan')}>
              New Loan
            </Button>
            <Button color="inherit" onClick={() => navigate('/loans')}>Loans</Button>
            <Button color="inherit" onClick={() => navigate('/loan-agreements')}>Agreements</Button>
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

      <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
        <Typography
          variant="h4"
          align="center"
          sx={{
            mb: 4,
            fontWeight: 'bold'
          }}
        >
          Welcome, {user.name}
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  💰 Total Loaned Principal
                </Typography>
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Ksh {Number(data.totalLoanedPrincipal || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  📊 Outstanding Receivables
                </Typography>
                <Typography variant="h4" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                  Ksh {Number(data.totalOutstandingReceivables || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  ✅ Active Loans
                </Typography>
                <Typography variant="h4" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                  {data.totalActiveLoans || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  ⚠️ Defaulted Loans
                </Typography>
                <Typography variant="h4" sx={{ color: 'error.main', fontWeight: 'bold' }}>
                  {data.totalDefaultedLoans || 0}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  📈 Month-to-Date P/L
                </Typography>
                <Typography
                  variant="h4"
                  sx={{
                    color: (data.monthToDateProfitLoss || 0) >= 0 ? 'success.main' : 'error.main',
                    fontWeight: 'bold'
                  }}
                >
                  Ksh {Number(data.monthToDateProfitLoss || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} sm={6} md={4}>
            <Card sx={{
              transition: 'all 0.3s',
              '&:hover': {
                transform: 'translateY(-4px)',
                boxShadow: 3
              }
            }}>
              <CardContent sx={{ textAlign: 'center', py: 3 }}>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  💸 Month-to-Date Expenses
                </Typography>
                <Typography variant="h4" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                  Ksh {Number(data.monthToDateExpenses || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        {/* Quick Actions */}
        <Box sx={{ mt: 6, textAlign: 'center' }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold' }}>
            Quick Actions
          </Typography>
          <Grid container spacing={2} justifyContent="center" sx={{ display: { xs: 'none', md: 'flex' } }}>
            <Grid item>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/borrowers')}
                sx={{ minWidth: 150, py: 1.5 }}
              >
                Manage Borrowers
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/loans')}
                sx={{ minWidth: 150, py: 1.5 }}
              >
                Process Loans
              </Button>
            </Grid>
            <Grid item>
              <Button
                variant="contained"
                size="large"
                onClick={() => navigate('/reports')}
                sx={{ minWidth: 150, py: 1.5 }}
              >
                View Reports
              </Button>
            </Grid>
          </Grid>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminDashboard;