import React, { useState } from 'react';
import {
  Box, List, ListItem, ListItemButton, ListItemIcon, ListItemText,
  Typography, Drawer, IconButton, useMediaQuery, useTheme, Tooltip
} from '@mui/material';
import {
  Dashboard, People, AccountBalance, Description, Inventory,
  Receipt, Assessment, Settings, Group, Logout, Add,
  Menu as MenuIcon, Close
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import logo from '../assets/logo.png';

const DRAWER_WIDTH = 260;
const COLLAPSED_WIDTH = 70;

const Sidebar = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleCollapseToggle = () => {
    setCollapsed(!collapsed);
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

  // Menu items configuration - matching app's dark theme with unique icon colors
  const menuItems = [
    {
      label: 'Dashboard',
      icon: <Dashboard />,
      path: user?.role === 'admin' ? '/admin' : '/employee',
      iconColor: '#00D4FF', // Cyan
    },
    {
      label: 'New Loan',
      icon: <Add />,
      path: '/new-loan',
      isAction: true,
      iconColor: '#00FF9D', // Green (action)
    },
    {
      label: 'Borrowers',
      icon: <People />,
      path: '/borrowers',
      iconColor: '#FFB547', // Amber/Orange
    },
    {
      label: 'Loans',
      icon: <AccountBalance />,
      path: '/loans',
      iconColor: '#00FF9D', // Green
    },
    {
      label: 'Agreements',
      icon: <Description />,
      path: '/agreements',
      iconColor: '#A78BFA', // Purple
    },
    {
      label: 'Collaterals',
      icon: <Inventory />,
      path: '/collaterals',
      iconColor: '#34D399', // Emerald
    },
    {
      label: 'Expenses',
      icon: <Receipt />,
      path: '/expenses',
      iconColor: '#F87171', // Red/Coral
    },
    {
      label: 'Reports',
      icon: <Assessment />,
      path: '/reports',
      iconColor: '#60A5FA', // Blue
    },
  ];

  // Admin-only menu items
  const adminMenuItems = [
    {
      label: 'Settings',
      icon: <Settings />,
      path: '/settings',
      iconColor: '#9CA3AF', // Gray
    },
    {
      label: 'Users',
      icon: <Group />,
      path: '/users',
      iconColor: '#FBBF24', // Yellow
    },
  ];

  const currentDrawerWidth = collapsed ? COLLAPSED_WIDTH : DRAWER_WIDTH;

  const drawerContent = (isCollapsed = false) => (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        bgcolor: '#0A1628',
        color: 'white',
        overflow: 'hidden',
      }}
    >
      {/* Header/Logo */}
      <Box
        sx={{
          p: isCollapsed ? 1 : 1.5,
          bgcolor: '#0D1F35',
          borderBottom: '1px solid rgba(0, 255, 157, 0.1)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: isCollapsed ? 'center' : 'flex-start',
          gap: isCollapsed ? 0 : 1.5,
          minHeight: 64,
        }}
      >
        {!isMobile && (
          <IconButton
            onClick={handleCollapseToggle}
            sx={{ color: '#B0BEC5', p: 0.5, '&:hover': { color: '#00FF9D' } }}
          >
            <MenuIcon />
          </IconButton>
        )}
        <Box
          component="img"
          src={logo}
          alt="Core Q Capital"
          sx={{
            height: isCollapsed ? 28 : 40,
            maxWidth: '100%',
            objectFit: 'contain',
          }}
        />
        {isMobile && !isCollapsed && (
          <IconButton
            onClick={handleDrawerToggle}
            sx={{ ml: 'auto', color: '#B0BEC5', '&:hover': { color: '#FF4D6A' } }}
          >
            <Close />
          </IconButton>
        )}
      </Box>

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 1, overflowY: 'auto', overflowX: 'hidden' }}>
        {menuItems.map((item) => (
          <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
            <Tooltip title={isCollapsed ? item.label : ''} placement="right" arrow>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  py: 1.5,
                  px: isCollapsed ? 1.5 : 2,
                  mx: isCollapsed ? 0.5 : 1,
                  borderRadius: 2,
                  justifyContent: isCollapsed ? 'center' : 'flex-start',
                  bgcolor: isActive(item.path)
                    ? 'rgba(0, 255, 157, 0.15)'
                    : item.isAction
                      ? 'rgba(0, 255, 157, 0.1)'
                      : 'transparent',
                  borderLeft: isCollapsed ? 'none' : (isActive(item.path)
                    ? '3px solid #00FF9D'
                    : '3px solid transparent'),
                  '&:hover': {
                    bgcolor: isActive(item.path)
                      ? 'rgba(0, 255, 157, 0.2)'
                      : 'rgba(0, 255, 157, 0.08)',
                  },
                  transition: 'all 0.2s ease',
                  boxShadow: isActive(item.path) ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive(item.path) ? '#00FF9D' : item.iconColor || '#B0BEC5',
                    minWidth: isCollapsed ? 0 : 40,
                    justifyContent: 'center',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                {!isCollapsed && (
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{
                      fontWeight: isActive(item.path) ? 600 : 400,
                      color: isActive(item.path) ? '#00FF9D' : '#FFFFFF',
                      fontSize: '0.95rem',
                      whiteSpace: 'nowrap',
                    }}
                  />
                )}
              </ListItemButton>
            </Tooltip>
          </ListItem>
        ))}

        {/* Admin-only items */}
        {user?.role === 'admin' && (
          <>
            <Box sx={{ my: 2, mx: isCollapsed ? 1 : 2, borderTop: '1px solid rgba(255,255,255,0.1)' }} />
            {adminMenuItems.map((item) => (
              <ListItem key={item.label} disablePadding sx={{ mb: 0.5 }}>
                <Tooltip title={isCollapsed ? item.label : ''} placement="right" arrow>
                  <ListItemButton
                    onClick={() => handleNavigation(item.path)}
                    sx={{
                      py: 1.5,
                      px: isCollapsed ? 1.5 : 2,
                      mx: isCollapsed ? 0.5 : 1,
                      borderRadius: 2,
                      justifyContent: isCollapsed ? 'center' : 'flex-start',
                      bgcolor: isActive(item.path)
                        ? 'rgba(0, 255, 157, 0.15)'
                        : 'transparent',
                      borderLeft: isCollapsed ? 'none' : (isActive(item.path)
                        ? '3px solid #00FF9D'
                        : '3px solid transparent'),
                      '&:hover': {
                        bgcolor: isActive(item.path)
                          ? 'rgba(0, 255, 157, 0.2)'
                          : 'rgba(0, 255, 157, 0.08)',
                      },
                      transition: 'all 0.2s ease',
                      boxShadow: isActive(item.path) ? 'inset 0 0 0 1px rgba(0,0,0,0.08)' : 'none',
                    }}
                  >
                    <ListItemIcon
                      sx={{
                        color: isActive(item.path) ? '#00FF9D' : item.iconColor || '#B0BEC5',
                        minWidth: isCollapsed ? 0 : 40,
                        justifyContent: 'center',
                      }}
                    >
                      {item.icon}
                    </ListItemIcon>
                    {!isCollapsed && (
                      <ListItemText
                        primary={item.label}
                        primaryTypographyProps={{
                          fontWeight: isActive(item.path) ? 600 : 400,
                          color: isActive(item.path) ? '#00FF9D' : '#FFFFFF',
                          fontSize: '0.95rem',
                          whiteSpace: 'nowrap',
                        }}
                      />
                    )}
                  </ListItemButton>
                </Tooltip>
              </ListItem>
            ))}
          </>
        )}
      </List>

      {/* User info and Logout at bottom */}
      <Box sx={{ borderTop: '1px solid rgba(255,255,255,0.1)', p: isCollapsed ? 1 : 2 }}>
        {!isCollapsed && (
          <>
            <Typography variant="body2" sx={{ color: '#B0BEC5', mb: 1 }}>
              Logged in as
            </Typography>
            <Typography variant="body1" sx={{ color: '#FFFFFF', fontWeight: 600, mb: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {user?.name || 'User'}
            </Typography>
          </>
        )}
        <Tooltip title={isCollapsed ? 'Logout' : ''} placement="right" arrow>
          <ListItemButton
            onClick={logout}
            sx={{
              py: 1.5,
              px: isCollapsed ? 1.5 : 2,
              borderRadius: 2,
              justifyContent: isCollapsed ? 'center' : 'flex-start',
              bgcolor: 'rgba(255, 77, 106, 0.1)',
              '&:hover': {
                bgcolor: 'rgba(255, 77, 106, 0.2)',
              },
            }}
          >
            <ListItemIcon sx={{ color: '#FF4D6A', minWidth: isCollapsed ? 0 : 40, justifyContent: 'center' }}>
              <Logout />
            </ListItemIcon>
            {!isCollapsed && (
              <ListItemText
                primary="Logout"
                primaryTypographyProps={{ color: '#FF4D6A', fontWeight: 500, whiteSpace: 'nowrap' }}
              />
            )}
          </ListItemButton>
        </Tooltip>
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
            bgcolor: '#0D1F35',
            borderBottom: '1px solid rgba(0, 255, 157, 0.1)',
            display: 'flex',
            alignItems: 'center',
            p: 1,
            gap: 1.5,
          }}
        >
          <IconButton onClick={handleDrawerToggle} sx={{ color: '#B0BEC5', '&:hover': { color: '#00FF9D' } }}>
            <MenuIcon />
          </IconButton>
          <Box
            component="img"
            src={logo}
            alt="Core Q Capital"
            sx={{
              height: 36,
              objectFit: 'contain',
            }}
          />
        </Box>
      )}

      {/* Sidebar Drawer */}
      <Box
        component="nav"
        sx={{
          width: { md: currentDrawerWidth },
          flexShrink: { md: 0 },
          transition: 'width 0.3s ease',
        }}
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
          {drawerContent(false)}
        </Drawer>

        {/* Desktop Drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', md: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: currentDrawerWidth,
              borderRight: '1px solid rgba(0, 255, 157, 0.1)',
              bgcolor: '#0A1628',
              transition: 'width 0.3s ease',
              overflowX: 'hidden',
            },
          }}
          open
        >
          {drawerContent(collapsed)}
        </Drawer>
      </Box>

      {/* Main Content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          width: { md: `calc(100% - ${currentDrawerWidth}px)` },
          mt: { xs: 8, md: 0 },
          bgcolor: '#0A1628',
          minHeight: '100vh',
          transition: 'width 0.3s ease, margin-left 0.3s ease',
        }}
      >
        {children}
      </Box>
    </Box>
  );
};

export default Sidebar;
