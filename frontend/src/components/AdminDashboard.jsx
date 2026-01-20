import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, Box } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({});

  useEffect(() => {
    axios.get('/api/financial/dashboard/admin').then(res => setData(res.data));
  }, []);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
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
                Total Loaned Principal
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
                Outstanding Receivables
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
                Active Loans
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
                Defaulted Loans
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
                Month-to-Date P/L
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
                Month-to-Date Expenses
              </Typography>
              <Typography variant="h4" sx={{ color: 'warning.main', fontWeight: 'bold' }}>
                Ksh {Number(data.monthToDateExpenses || 0).toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default AdminDashboard;
