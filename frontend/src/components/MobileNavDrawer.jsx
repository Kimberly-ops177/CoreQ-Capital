import React, { useState } from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Box,
  Divider,
  Typography
} from '@mui/material';
import {
  Menu as MenuIcon,
  Dashboard as DashboardIcon,
  AccountBalance as LoanIcon,
  Description as AgreementIcon,
  People as BorrowersIcon,
  Inventory as CollateralIcon,
  Receipt as ExpenseIcon,
  Assessment as ReportIcon,
  Settings as SettingsIcon,
  Group as UsersIcon,
  Logout as LogoutIcon,
  Add as AddIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const MobileNavDrawer = ({ userRole }) => {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const navigate = useNavigate();
  const { logout } = useAuth();

  const toggleDrawer = (open) => (event) => {
    if (event.type === 'keydown' && (event.key === 'Tab' || event.key === 'Shift')) {
      return;
    }
    setDrawerOpen(open);
  };

  const handleNavigation = (path) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const handleLogout = () => {
    logout();
    setDrawerOpen(false);
  };

  // Menu items for admin
  const adminMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/admin' },
    { text: 'New Loan', icon: <AddIcon />, path: '/new-loan', primary: true },
    { text: 'Loans', icon: <LoanIcon />, path: '/loans' },
    { text: 'Loan Agreements', icon: <AgreementIcon />, path: '/loan-agreements' },
    { text: 'Borrowers', icon: <BorrowersIcon />, path: '/borrowers' },
    { text: 'Collaterals', icon: <CollateralIcon />, path: '/collaterals' },
    { text: 'Expenses', icon: <ExpenseIcon />, path: '/expenses' },
    { text: 'Reports', icon: <ReportIcon />, path: '/reports' },
    { text: 'Settings', icon: <SettingsIcon />, path: '/settings' },
    { text: 'Users', icon: <UsersIcon />, path: '/users' }
  ];

  // Menu items for employee
  const employeeMenuItems = [
    { text: 'Dashboard', icon: <DashboardIcon />, path: '/employee' },
    { text: 'New Loan', icon: <AddIcon />, path: '/new-loan', primary: true },
    { text: 'Loans', icon: <LoanIcon />, path: '/loans' },
    { text: 'Loan Agreements', icon: <AgreementIcon />, path: '/loan-agreements' },
    { text: 'Borrowers', icon: <BorrowersIcon />, path: '/borrowers' },
    { text: 'Collaterals', icon: <CollateralIcon />, path: '/collaterals' }
  ];

  const menuItems = userRole === 'admin' ? adminMenuItems : employeeMenuItems;

  return (
    <>
      {/* Hamburger Menu Button - Only visible on mobile */}
      <IconButton
        color="inherit"
        aria-label="open menu"
        edge="start"
        onClick={toggleDrawer(true)}
        sx={{ display: { xs: 'block', md: 'none' } }}
      >
        <MenuIcon />
      </IconButton>

      {/* Navigation Drawer */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={toggleDrawer(false)}
        sx={{
          '& .MuiDrawer-paper': {
            width: 280,
            backgroundColor: 'background.default'
          }
        }}
      >
        <Box
          sx={{ width: 280 }}
          role="presentation"
        >
          {/* Header */}
          <Box sx={{ p: 2, backgroundColor: 'primary.main' }}>
            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.contrastText' }}>
              🏦 Core Q Capital
            </Typography>
            <Typography variant="caption" sx={{ color: 'primary.contrastText', opacity: 0.8 }}>
              {userRole === 'admin' ? 'Admin Portal' : 'Employee Portal'}
            </Typography>
          </Box>

          <Divider />

          {/* Menu Items */}
          <List>
            {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton
                  onClick={() => handleNavigation(item.path)}
                  sx={{
                    py: 1.5,
                    ...(item.primary && {
                      backgroundColor: 'success.main',
                      color: 'success.contrastText',
                      '&:hover': {
                        backgroundColor: 'success.dark'
                      }
                    })
                  }}
                >
                  <ListItemIcon
                    sx={{
                      color: item.primary ? 'success.contrastText' : 'inherit',
                      minWidth: 40
                    }}
                  >
                    {item.icon}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{
                      fontWeight: item.primary ? 'bold' : 'normal'
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>

          <Divider />

          {/* Logout */}
          <List>
            <ListItem disablePadding>
              <ListItemButton onClick={handleLogout} sx={{ py: 1.5 }}>
                <ListItemIcon sx={{ minWidth: 40 }}>
                  <LogoutIcon />
                </ListItemIcon>
                <ListItemText primary="Logout" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default MobileNavDrawer;
