import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import EmployeeDashboard from './components/EmployeeDashboard';
import BorrowerManagement from './components/BorrowerManagement';
import LoanManagement from './components/LoanManagement';
import LoanApplicationForm from './components/LoanApplicationForm';
import LoanAgreements from './components/LoanAgreements';
import CollateralManagement from './components/CollateralManagement';
import ExpenseManagement from './components/ExpenseManagement';
import Reporting from './components/Reporting';
import Settings from './components/Settings';
import UserManagement from './components/UserManagement';
import Sidebar from './components/Sidebar';
import { AuthProvider, useAuth } from './contexts/AuthContext';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#00FF9D', // Bright green (Kifaru accent)
      light: '#4DFFBD',
      dark: '#00CC7D',
      contrastText: '#0A1628',
    },
    secondary: {
      main: '#00D4FF', // Cyan blue
      light: '#4DE4FF',
      dark: '#00A8CC',
      contrastText: '#0A1628',
    },
    success: {
      main: '#00FF9D',
      light: '#4DFFBD',
      dark: '#00CC7D',
    },
    warning: {
      main: '#FFB547',
      light: '#FFD084',
      dark: '#E89A2A',
    },
    error: {
      main: '#FF4D6A',
      light: '#FF7A8F',
      dark: '#CC2E4A',
    },
    info: {
      main: '#00D4FF',
      light: '#4DE4FF',
      dark: '#00A8CC',
    },
    background: {
      default: '#0A1628', // Dark navy blue (Kifaru background)
      paper: '#1A2B45', // Slightly lighter for cards
    },
    text: {
      primary: '#FFFFFF',
      secondary: '#B0BEC5',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h4: {
      fontWeight: 700,
      color: '#FFFFFF',
    },
    h5: {
      fontWeight: 600,
      color: '#00FF9D',
    },
    h6: {
      fontWeight: 600,
      color: '#FFFFFF',
    },
  },
  components: {
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          textTransform: 'none',
          fontWeight: 600,
        },
        contained: {
          background: 'linear-gradient(135deg, #00FF9D 0%, #00D4FF 100%)',
          color: '#0A1628',
          boxShadow: '0 4px 20px rgba(0, 255, 157, 0.3)',
          '&:hover': {
            background: 'linear-gradient(135deg, #00CC7D 0%, #00A8CC 100%)',
            boxShadow: '0 6px 24px rgba(0, 255, 157, 0.4)',
          },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          backgroundColor: '#1A2B45',
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.3)',
          border: '1px solid rgba(0, 255, 157, 0.1)',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(135deg, #0A1628 0%, #1A2B45 100%)',
          borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
          boxShadow: '0 2px 16px rgba(0, 0, 0, 0.4)',
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#1A2B45',
          backgroundImage: 'none',
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        root: {
          borderColor: 'rgba(255, 255, 255, 0.1)',
        },
        head: {
          backgroundColor: '#0F1F35',
          color: '#00FF9D',
          fontWeight: 700,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppRoutes />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

function AppRoutes() {
  const { user, loading } = useAuth();

  // Show loading state while checking authentication
  if (loading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#0A1628'
      }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{
            width: '50px',
            height: '50px',
            border: '4px solid rgba(0, 255, 157, 0.2)',
            borderTop: '4px solid #00FF9D',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 16px'
          }} />
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
          <h2 style={{ color: '#00FF9D', margin: 0, fontSize: '1.2rem', fontWeight: 600 }}>Loading Core Q Capital...</h2>
        </div>
      </div>
    );
  }

  // Routes without sidebar (login)
  if (!user) {
    return (
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Routes with sidebar (authenticated)
  return (
    <Sidebar>
      <Routes>
        <Route path="/" element={user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/employee" />} />
        <Route path="/login" element={user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/employee" />} />
        <Route path="/admin" element={user.role === 'admin' ? <AdminDashboard /> : <Navigate to="/employee" />} />
        <Route path="/employee" element={user.role === 'employee' ? <EmployeeDashboard /> : <Navigate to="/admin" />} />
        <Route path="/new-loan" element={<LoanApplicationForm />} />
        <Route path="/borrowers" element={<BorrowerManagement />} />
        <Route path="/loans" element={<LoanManagement />} />
        <Route path="/agreements" element={<LoanAgreements />} />
        <Route path="/loan-agreements" element={<LoanAgreements />} />
        <Route path="/collaterals" element={<CollateralManagement />} />
        <Route path="/expenses" element={<ExpenseManagement />} />
        <Route path="/reports" element={<Reporting />} />
        <Route path="/settings" element={user.role === 'admin' ? <Settings /> : <Navigate to="/employee" />} />
        <Route path="/users" element={user.role === 'admin' ? <UserManagement /> : <Navigate to="/employee" />} />
        <Route path="*" element={user.role === 'admin' ? <Navigate to="/admin" /> : <Navigate to="/employee" />} />
      </Routes>
    </Sidebar>
  );
}

export default App;
