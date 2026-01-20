import React, { useMemo, useState } from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Drawer, IconButton, useMediaQuery, useTheme
} from '@mui/material';
import {
  Dashboard, People, AccountBalance, Description, Inventory,
  Receipt, Assessment, Settings, Group, Logout, Add,
  Menu as MenuIcon, Close
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';

const DRAWER_WIDTH = 270;

const Sidebar = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const animateKey = useMemo(() => location.pathname, [location.pathname]);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleNavigation = (path) => {
    navigate(path);
    if (isMobile) {
      setMobileOpen(false);
    }
  };

  const isActive = (path) => {
    if (path === '/admin' || path === '/employee') {
      return location.pathname === '/admin' || location.pathname === '/employee';
    }
    return location.pathname === path;
  };

  // Menu items configuration - matching app's dark theme
  const menuItems = [
    {
      label: 'Dashboard',
      icon: <Dashboard />,
      path: user?.role === 'admin' ? '/admin' : '/employee',
    },
    {
      label: 'New Loan',
      icon: <Add />,
      path: '/new-loan',
      isAction: true,
    },
    {
      label: 'Borrowers',
      icon: <People />,
      path: '/borrowers',
    },
    {
      label: 'Loans',
      icon: <AccountBalance />,
      path: '/loans',
    },
    {
      label: 'Agreements',
      icon: <Description />,
      path: '/agreements',
    },
    {
      label: 'Collaterals',
      icon: <Inventory />,
      path: '/collaterals',
    },
    {
      label: 'Expenses',
      icon: <Receipt />,
      path: '/expenses',
    },
    {
      label: 'Reports',
      icon: <Assessment />,
      path: '/reports',
    },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    {
      label: 'Settings',
      icon: <Settings />,
      path: '/settings',
    },
    {
      label: 'Users',
      icon: <Group />,
      path: '/users',
    },
  ];

  // palette tuned to provided screenshot (green/teal gradient with red active)
  const colors = useMemo(() => ({
    gradient: 'linear-gradient(180deg, #10e9a8 0%, #0db6ff 100%)',
    gradientHover: 'linear-gradient(180deg, #1af4b5 0%, #2dc6ff 100%)',
    base: '#0db6ff',
    baseDark: '#0a97d4',
    highlight: '#ff3b5f', // active red accent
    icon: '#0b1a2b',
    text: '#0b1a2b',
    textOnActive: '#ffffff',
    divider: 'rgba(11, 26, 43, 0.18)',
  }), []);

  const drawerContent = (
    <Box
      key={animateKey}
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: colors.base,
        color: colors.text,
        position: 'relative',
        overflow: 'hidden',
        animation: 'slide-in-left 320ms ease',
        '@keyframes slide-in-left': {
          from: { transform: 'translateX(-22px)', opacity: 0.4 },
          to: { transform: 'translateX(0)', opacity: 1 },
        },
      }}
    >
      {/* Header/Logo */}
      <Box
        sx={{
          p: 2,
          background: colors.gradient,
          display: 'flex',
          alignItems: 'center',
          gap: 1,
        }}
      >
        <AccountBalance sx={{ fontSize: 28, color: colors.text }} />
        <Typography variant="h6" sx={{ fontWeight: 'bold', color: colors.text }}>
          Core Q Capital
        </Typography>
        {isMobile && (
          <IconButton
            onClick={handleDrawerToggle}
             sx={{ ml: 'auto', color: colors.text }}
           >
             <Close />
           </IconButton>
        )}
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1 }}>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                py: 1.5,
                px: 2,
                mx: 1,
                borderRadius: 2,
                bgcolor: isActive(item.path)
                  ? colors.highlight
                  : 'transparent',
                borderLeft: isActive(item.path)
                  ? `6px solid ${colors.textOnActive}`
                  : `6px solid transparent`,
                '&:hover': {
                  bgcolor: isActive(item.path)
                    ? colors.highlight
                    : colors.gradientHover,
                },
                transition: 'all 0.18s ease',
                boxShadow: isActive(item.path)
                  ? 'inset 0 0 0 1px rgba(0,0,0,0.18)'
                  : 'none',
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? colors.textOnActive : colors.icon,
                  minWidth: 40
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 800 : 600,
                  color: isActive(item.path) ? colors.textOnActive : colors.text,
                  fontSize: '0.98rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}

        {/* Admin-only items */}
        {user?.role === 'admin' && (
          <>
            <Box sx={{ my: 2, mx: 2, borderTop: '1px solid rgba(255,255,255,0.1)' }} />
            {adminMenuItems.map((item) => (
              <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <ListItemButton
              onClick={() => handleNavigation(item.path)}
              sx={{
                py: 1.5,
                px: 2,
                mx: 1,
                borderRadius: 2,
                bgcolor: isActive(item.path)
                  ? colors.highlight
                  : 'transparent',
                borderLeft: isActive(item.path)
                  ? `6px solid ${colors.textOnActive}`
                  : `6px solid transparent`,
                '&:hover': {
                  bgcolor: isActive(item.path)
                    ? colors.highlight
                    : colors.gradientHover,
                },
                transition: 'all 0.18s ease',
                boxShadow: isActive(item.path)
                  ? 'inset 0 0 0 1px rgba(0,0,0,0.18)'
                  : 'none',
              }}
            >
              <ListItemIcon
                sx={{
                  color: isActive(item.path) ? colors.textOnActive : colors.icon,
                  minWidth: 40
                }}
              >
                {item.icon}
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: isActive(item.path) ? 800 : 600,
                  color: isActive(item.path) ? colors.textOnActive : colors.text,
                  fontSize: '0.98rem',
                }}
              />
            </ListItemButton>
          </ListItem>
        ))}
          </>
        )}
      </List>

      {/* User info and Logout at bottom */}
      <Box sx={{ borderTop: `1px solid ${colors.divider}`, p: 2 }}>
        <Typography variant="body2" sx={{ color: colors.text, mb: 1, opacity: 0.9 }}>
          Logged in as
        </Typography>
        <Typography variant="body1" sx={{ color: colors.text, fontWeight: 700, mb: 2 }}>
          {user?.name || 'User'}
        </Typography>
        <ListItemButton
          onClick={logout}
          sx={{
            py: 1.5,
            px: 2,
            borderRadius: 2,
            bgcolor: 'rgba(255, 77, 106, 0.12)',
            '&:hover': {
              bgcolor: 'rgba(255, 77, 106, 0.2)',
            },
          }}
        >
          <ListItemIcon sx={{ color: '#FF4D6A', minWidth: 40 }}>
            <Logout />
          </ListItemIcon>
          <ListItemText
            primary="Logout"
            primaryTypographyProps={{ color: '#FF4D6A', fontWeight: 500 }}
          />
        </ListItemButton>
      </Box>
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* Mobile App Bar */}
      {isMobile && (
        <Box
          sx={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1200,
            background: 'linear-gradient(135deg, #0A1628 0%, #1A2B45 100%)',
            borderBottom: '1px solid rgba(0, 255, 157, 0.2)',
            display: 'flex',
            alignItems: 'center',
            p: 1.5,
            gap: 1,
          }}
        >
          <IconButton onClick={handleDrawerToggle} sx={{ color: '#00FF9D' }}>
            <MenuIcon />
          </IconButton>
          <AccountBalance sx={{ color: '#00FF9D' }} />
          <Typography variant="h6" sx={{ color: 'white', fontWeight: 'bold' }}>
            Core Q Capital
          </Typography>
        </Box>
      )}

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{ width: { md: DRAWER_WIDTH }, flexShrink: { md: 0 } }}
      >
        {/* Mobile Drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', md: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              bgcolor: '#0A1628',
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
              borderRight: '1px solid rgba(0, 255, 157, 0.1)',
              bgcolor: '#0A1628',
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: { xs: 8, md: 0 },
          bgcolor: '#F4F6FB',
          minHeight: '100vh',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Sidebar;
