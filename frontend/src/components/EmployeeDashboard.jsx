import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import axios from 'axios';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({});

  useEffect(() => {
    axios.get('/api/financial/dashboard/employee').then(res => setData(res.data));
  }, []);

  return (
    <Container sx={{ py: 4 }}>
        <Typography variant="h4" gutterBottom>
          Welcome, {user.name}
        </Typography>
        <Grid container spacing={3}>
          {/* Financial Overview Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              Financial Overview
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Loaned Principal</Typography>
                <Typography variant="h4">KES {(data.totalLoanedPrincipal || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Total Outstanding Receivables</Typography>
                <Typography variant="h4">KES {(data.totalOutstandingReceivables || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Month-to-Date Profit/Loss</Typography>
                <Typography variant="h4" color={data.monthToDateProfitLoss >= 0 ? 'success.main' : 'error.main'}>
                  KES {(data.monthToDateProfitLoss || 0).toLocaleString()}
                </Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Loan Status Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              Loan Status
            </Typography>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Active Loans</Typography>
                <Typography variant="h4">{data.totalActiveLoans || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Defaulted Loans</Typography>
                <Typography variant="h4" color="error.main">{data.totalDefaultedLoans || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Loans Due This Week</Typography>
                <Typography variant="h4">{data.loansDueThisWeek || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={3}>
            <Card>
              <CardContent>
                <Typography variant="h6">Loans in Grace Period</Typography>
                <Typography variant="h4" color="warning.main">{data.loansInGracePeriod || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Activity Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              Recent Activity
            </Typography>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">New Borrowers Today</Typography>
                <Typography variant="h4">{data.newBorrowersRegisteredToday || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Loans Issued Today</Typography>
                <Typography variant="h4">{data.totalLoansIssuedToday || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={4}>
            <Card>
              <CardContent>
                <Typography variant="h6">Loans Issued This Week</Typography>
                <Typography variant="h4">{data.totalLoansIssuedThisWeek || 0}</Typography>
              </CardContent>
            </Card>
          </Grid>

          {/* Expenses Section */}
          <Grid item xs={12}>
            <Typography variant="h5" gutterBottom sx={{ mt: 2 }}>
              Expenses
            </Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6">Month-to-Date Expenses</Typography>
                <Typography variant="h4">KES {(data.monthToDateExpenses || 0).toLocaleString()}</Typography>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      </Container>
  );
};

export default EmployeeDashboard;