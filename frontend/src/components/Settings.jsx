import React, { useEffect, useState } from 'react';
import {
  Container, Typography, Button, Grid, Card, CardContent, TextField, Box
} from '@mui/material';
import axios from 'axios';

const Settings = () => {
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
    <Container sx={{ py: 4 }}>
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
  );
};

export default Settings;