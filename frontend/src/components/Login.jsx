import React, { useState, useEffect } from 'react';
import { TextField, Button, Container, Typography, Box, Paper } from '@mui/material';
import { useAuth } from '../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { login, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      navigate(user.role === 'admin' ? '/admin' : '/employee');
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(email, password);
      // Navigation handled by useEffect
    } catch (err) {
      const message = err?.response?.data?.error || err?.message || 'Login failed';
      alert(message);
    }
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #0A1628 0%, #152238 50%, #1a2942 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        p: 2
      }}
    >
      <Container maxWidth="sm">
        <Paper
          elevation={24}
          sx={{
            p: { xs: 3, sm: 5 },
            borderRadius: 4,
            background: 'rgba(15, 23, 42, 0.95)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(0, 255, 157, 0.1)',
            boxShadow: '0 8px 32px rgba(0, 255, 157, 0.1)',
            width: '100%'
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            align="center"
            sx={{
              mb: 2,
              fontWeight: 'bold',
              background: 'linear-gradient(135deg, #00FF9D 0%, #00D4AA 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              textShadow: '0 0 30px rgba(0, 255, 157, 0.3)',
              fontSize: { xs: '1.8rem', sm: '2.125rem' }
            }}
          >
            🏦 Core Q Capital
          </Typography>
          <Typography
            variant="h6"
            align="center"
            sx={{
              mb: 4,
              color: 'rgba(255, 255, 255, 0.7)',
              fontWeight: 500
            }}
          >
            Staff Login Portal
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              sx={{
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00FF9D',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00FF9D',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#00FF9D',
                }
              }}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              sx={{
                '& .MuiInputLabel-root': {
                  color: 'rgba(255, 255, 255, 0.7)',
                },
                '& .MuiOutlinedInput-root': {
                  color: '#fff',
                  backgroundColor: 'rgba(255, 255, 255, 0.05)',
                  '& fieldset': {
                    borderColor: 'rgba(255, 255, 255, 0.2)',
                  },
                  '&:hover fieldset': {
                    borderColor: '#00FF9D',
                  },
                  '&.Mui-focused fieldset': {
                    borderColor: '#00FF9D',
                    borderWidth: '2px',
                  },
                },
                '& .MuiInputLabel-root.Mui-focused': {
                  color: '#00FF9D',
                }
              }}
            />
            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{
                mt: 3,
                mb: 2,
                py: 1.5,
                fontSize: '1.1rem',
                fontWeight: 'bold',
                background: 'linear-gradient(135deg, #00FF9D 0%, #00D4AA 100%)',
                color: '#0A1628',
                boxShadow: '0 4px 20px rgba(0, 255, 157, 0.4)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #00D4AA 0%, #00FF9D 100%)',
                  boxShadow: '0 6px 30px rgba(0, 255, 157, 0.6)',
                  transform: 'translateY(-2px)',
                },
                transition: 'all 0.3s ease'
              }}
            >
              Sign In
            </Button>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
};

export default Login;
