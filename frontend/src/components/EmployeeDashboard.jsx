import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Grid, Card, CardContent, Button, Box, Paper
} from '@mui/material';
import {
  Add, Payment, PersonAdd, People, CheckCircle, Warning, Schedule
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

// Action card component
const ActionCard = ({ icon: IconComponent, title, description, onClick, color = 'primary' }) => (
  <Card
    sx={{
      height: '100%',
      minHeight: 220,
      display: 'flex',
      flexDirection: 'column',
      transition: 'transform 0.2s, box-shadow 0.2s',
      cursor: 'pointer',
      '&:hover': {
        transform: 'translateY(-4px)',
        boxShadow: 6
      }
    }}
    onClick={onClick}
  >
    <CardContent sx={{
      flex: 1,
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      p: 4
    }}>
      <IconComponent sx={{ fontSize: 56, color: `${color}.main`, mb: 2 }} />
      <Typography variant="h6" gutterBottom sx={{ fontWeight: 600 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 2, flexGrow: 1 }}>
        {description}
      </Typography>
      <Button variant="contained" color={color} size="medium">
        Go
      </Button>
    </CardContent>
  </Card>
);

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({});

  useEffect(() => {
    axios.get('/api/financial/dashboard/employee').then(res => setData(res.data));
  }, []);

  return (
    <Container sx={{ py: 4 }}>
      {/* Welcome Header */}
      <Typography variant="h4" gutterBottom>
        Welcome, {user.name}
      </Typography>
      <Typography variant="body1" color="text.secondary" gutterBottom sx={{ mb: 3 }}>
        Location: {user.assignedLocation || 'All Locations'}
      </Typography>

      {/* Stats Overview Bar */}
      <Paper elevation={2} sx={{
        p: 3,
        mb: 4,
        background: 'linear-gradient(135deg, #1e3a8a 0%, #0d9488 100%)',
        color: 'white'
      }}>
        <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
          Quick Stats Overview
        </Typography>
        <Grid container spacing={3}>
          <Grid item xs={6} md={2.4}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {data.totalActiveLoans || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Active Loans
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {data.totalPastDueLoans || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Past Due
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                {data.totalDefaultedLoans || 0}
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Defaulted Loans
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                KES {((data.totalLoanedPrincipal || 0) / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Total Loaned
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={6} md={2.4}>
            <Box>
              <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                KES {((data.totalOutstandingReceivables || 0) / 1000).toFixed(0)}K
              </Typography>
              <Typography variant="body2" sx={{ opacity: 0.9 }}>
                Outstanding
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Paper>

      {/* Quick Actions Section */}
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        Quick Actions
      </Typography>
      <Grid container spacing={4}>
        {/* Loan Processing Workflow */}
        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            icon={PersonAdd}
            title="Register Borrower"
            description="Add new client to the system"
            onClick={() => navigate('/borrowers')}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            icon={Add}
            title="Issue New Loan"
            description="Create and approve new loan applications"
            onClick={() => navigate('/loan-applications')}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            icon={Payment}
            title="Repay Loan"
            description="Record loan repayments"
            onClick={() => navigate('/loans')}
            color="success"
          />
        </Grid>

        {/* Management & Monitoring Workflow */}
        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            icon={People}
            title="View & Update Borrowers"
            description="Search and manage borrower details"
            onClick={() => navigate('/borrowers')}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            icon={CheckCircle}
            title="View Active Loans"
            description={`${data.totalActiveLoans || 0} active loans for your location`}
            onClick={() => navigate('/loans')}
            color="primary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            icon={Schedule}
            title="View Past Due Loans"
            description={`${data.totalPastDueLoans || 0} loans in 7-day grace period`}
            onClick={() => navigate('/loans')}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <ActionCard
            icon={Warning}
            title="View Defaulted Loans"
            description={`${data.totalDefaultedLoans || 0} loans defaulted - Need attention`}
            onClick={() => navigate('/loans')}
            color="error"
          />
        </Grid>
      </Grid>
    </Container>
  );
};

export default EmployeeDashboard;