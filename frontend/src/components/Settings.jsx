import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Grid, Card, CardContent, TextField,
  AppBar, Toolbar, Box
} from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

const Settings = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [settings, setSettings] = useState({
    interestRates: { 1: 20, 2: 28, 3: 32, 4: 35 },
    penaltyFee: 3,
    gracePeriod: 7,
    loanThreshold: 12000,
    negotiableThreshold: 50000
  });

  const fetchSettings = async () => {
    try {
      const res = await axios.get('/api/settings');
      setSettings(res.data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const handleSave = async () => {
    try {
      await axios.patch('/api/settings', settings);
      alert('Settings saved successfully');
    } catch (err) {
      console.error('Error saving settings:', err);
      alert('Error saving settings');
    }
  };

  const handleInterestRateChange = (period, value) => {
    setSettings({
      ...settings,
      interestRates: {
        ...settings.interestRates,
        [period]: parseFloat(value) || 0
      }
    });
  };

  return (
    <Box sx={{ minHeight: '100vh' }}>
      <AppBar position="static">
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            🏦 Core Q Capital - Settings
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
        <Typography variant="h4" gutterBottom>System Settings</Typography>

        <Grid container spacing={3}>
          <Grid item xs={12}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Interest Rates (%)</Typography>
                <Grid container spacing={2}>
                  {[1, 2, 3, 4].map((period) => (
                    <Grid item xs={12} sm={6} md={3} key={period}>
                      <TextField
                        fullWidth label={`${period} Week Loan`}
                        type="number" step="0.01"
                        value={settings.interestRates[period]}
                        onChange={(e) => handleInterestRateChange(period, e.target.value)}
                      />
                    </Grid>
                  ))}
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12} md={6}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>Loan Settings</Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Penalty Fee (% per day)"
                      type="number" step="0.01"
                      value={settings.penaltyFee}
                      onChange={(e) => setSettings({...settings, penaltyFee: parseFloat(e.target.value) || 0})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Grace Period (days)"
                      type="number"
                      value={settings.gracePeriod}
                      onChange={(e) => setSettings({...settings, gracePeriod: parseInt(e.target.value) || 0})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Loan Threshold for 4-week qualification"
                      type="number"
                      value={settings.loanThreshold}
                      onChange={(e) => setSettings({...settings, loanThreshold: parseInt(e.target.value) || 0})}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      fullWidth label="Negotiable Loan Threshold"
                      type="number"
                      value={settings.negotiableThreshold}
                      onChange={(e) => setSettings({...settings, negotiableThreshold: parseInt(e.target.value) || 0})}
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>

          <Grid item xs={12}>
            <Button variant="contained" size="large" onClick={handleSave}>
              Save Settings
            </Button>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
};

export default Settings;