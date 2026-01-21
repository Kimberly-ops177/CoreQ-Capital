import React, { useEffect, useState } from 'react';
import { Container, Typography, Grid, Card, CardContent, Box, Skeleton } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const palette = {
  pageBg: '#0b1a2b',
  cardBg: '#1f2f48',
  textPrimary: '#d8e4ff',
  green: '#16f2a3',
  cyan: '#16e7d2',
  red: '#ff4d6a',
  amber: '#f6b041'
};

const formatMoney = (value) =>
  Number(value || 0).toLocaleString('en-KE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

const StatCard = ({ label, value, color, loading }) => (
  <Card
    sx={{
      background: palette.cardBg,
      borderRadius: 3,
      boxShadow: '0 8px 24px rgba(0,0,0,0.35)',
      height: '100%',
    }}
  >
    <CardContent sx={{ textAlign: 'center', py: 3 }}>
      <Typography
        variant="h6"
        sx={{ color: palette.textPrimary, fontWeight: 600, mb: 1, letterSpacing: 0.2 }}
      >
        {label}
      </Typography>
      {loading ? (
        <Skeleton
          animation="wave"
          variant="text"
          width="60%"
          height={50}
          sx={{ mx: 'auto', bgcolor: 'rgba(255,255,255,0.1)' }}
        />
      ) : (
        <Typography
          variant="h4"
          sx={{
            color,
            fontWeight: 800,
            fontSize: { xs: '1.9rem', md: '2.2rem' },
          }}
        >
          {value}
        </Typography>
      )}
    </CardContent>
  </Card>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [data, setData] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    axios.get('/api/financial/dashboard/admin')
      .then(res => setData(res.data))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ bgcolor: palette.pageBg, minHeight: '100vh', py: { xs: 4, md: 6 } }}>
      <Container maxWidth="lg">
        <Typography
          variant="h4"
          align="center"
          sx={{
            mb: { xs: 3, md: 5 },
            fontWeight: 800,
            color: '#ffffff',
            fontSize: { xs: '2rem', md: '2.6rem' },
          }}
        >
          Welcome, {user.name}
        </Typography>

        <Grid container spacing={3} justifyContent="center">
          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="💰 Total Loaned Principal"
              value={`Ksh ${formatMoney(data.totalLoanedPrincipal)}`}
              color={palette.green}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="📊 Outstanding Receivables"
              value={`Ksh ${formatMoney(data.totalOutstandingReceivables)}`}
              color={palette.cyan}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="✅ Active Loans"
              value={data.totalActiveLoans || 0}
              color={palette.green}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <StatCard
              label="⚠️ Defaulted Loans"
              value={data.totalDefaultedLoans || 0}
              color={palette.red}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} md={5}>
            <StatCard
              label="📈 Month-to-Date P/L"
              value={`Ksh ${formatMoney(data.monthToDateProfitLoss)}`}
              color={(data.monthToDateProfitLoss || 0) >= 0 ? palette.green : palette.red}
              loading={loading}
            />
          </Grid>

          <Grid item xs={12} md={5}>
            <StatCard
              label="💸 Month-to-Date Expenses"
              value={`Ksh ${formatMoney(data.monthToDateExpenses)}`}
              color={palette.amber}
              loading={loading}
            />
          </Grid>
        </Grid>

        <Box sx={{ mt: { xs: 4, md: 6 }, textAlign: 'center' }}>
          <Typography
            variant="h5"
            sx={{
              color: palette.green,
              fontWeight: 800,
              mb: 2.5,
              letterSpacing: 0.4,
            }}
          >
            Quick Actions
          </Typography>

          <Box
            sx={{
              display: 'flex',
              gap: 2,
              justifyContent: 'center',
              flexWrap: 'wrap',
            }}
          >
            {[
              { label: 'Manage Borrowers', path: '/borrowers', color: 'linear-gradient(135deg, #00f7b2 0%, #00d7ff 100%)' },
              { label: 'Process Loans', path: '/loans', color: 'linear-gradient(135deg, #00f7b2 0%, #00d7ff 100%)' },
              { label: 'Record Repayment', path: '/loans?action=payment', color: 'linear-gradient(135deg, #f6b041 0%, #ff8c00 100%)' },
              { label: 'View Reports', path: '/reports', color: 'linear-gradient(135deg, #00f7b2 0%, #00d7ff 100%)' },
            ].map((action) => (
              <Box
                key={action.label}
                component="button"
                onClick={() => navigate(action.path)}
                sx={{
                  border: 'none',
                  cursor: 'pointer',
                  background: action.color,
                  color: '#0b1a2b',
                  fontWeight: 800,
                  fontSize: '1rem',
                  px: 4,
                  py: 1.3,
                  borderRadius: 2,
                  minWidth: { xs: '220px', md: '240px' },
                  boxShadow: '0 8px 18px rgba(0,0,0,0.25)',
                  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
                  '&:hover': {
                    transform: 'translateY(-2px)',
                    boxShadow: '0 12px 22px rgba(0,0,0,0.32)',
                  },
                  '&:active': {
                    transform: 'translateY(0)',
                  },
                }}
              >
                {action.label}
              </Box>
            ))}
          </Box>
        </Box>
      </Container>
    </Box>
  );
};

export default AdminDashboard;
