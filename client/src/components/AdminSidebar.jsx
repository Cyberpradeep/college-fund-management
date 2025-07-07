import { NavLink, useNavigate, useLocation } from 'react-router-dom';  // Added useLocation
import { useAuth } from '../context/AuthContext';
import { 
  Button, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography,
  Box,
  Avatar,
  Divider,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import { 
  Logout, 
  Dashboard, 
  Business, 
  AccountBalance, 
  Receipt, 
  Assessment,
  ChevronLeft,
  ChevronRight,
  AdminPanelSettings
} from '@mui/icons-material';
import { useState } from 'react';

const AdminSidebar = () => {
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();  // Added to get current URL
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const toggleSidebar = () => {
    setCollapsed(!collapsed);
  };

  const navItems = [
    { to: "/admin/dashboard", text: "Dashboard", icon: <Dashboard /> },
    { to: "/admin/departments", text: "Departments", icon: <Business /> },
    { to: "/admin/allocate", text: "Allocate Funds", icon: <AccountBalance /> },
    { to: "/admin/bills", text: "Verify Bills", icon: <Receipt /> },
    { to: "/admin/reports", text: "Reports", icon: <Assessment /> },
  ];

  // Function to check if a nav item is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  const linkClass = ({ isActive }) => ({
    backgroundColor: isActive ? theme.palette.primary.light : 'transparent',
    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
    borderRadius: '8px',
    margin: '4px 0',
    '&:hover': {
      backgroundColor: theme.palette.action.hover,
    },
  });

  const sidebarWidth = collapsed ? 80 : 250;

  return (
    <Box 
      sx={{
        width: sidebarWidth,
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        backgroundColor: '#f8fafc',
        position: 'relative',
        borderRight: `1px solid ${theme.palette.divider}`,
      }}
    >
      {/* Collapse button */}
      <IconButton 
        onClick={toggleSidebar}
        sx={{
          position: 'absolute',
          top: 16,
          right: -16,
          width: 32,
          height: 32,
          backgroundColor: theme.palette.background.default,
          boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
          zIndex: 1,
          '&:hover': {
            backgroundColor: theme.palette.grey[200],
          }
        }}
      >
        {collapsed ? <ChevronRight /> : <ChevronLeft />}
      </IconButton>

      {/* Header with gradient background */}
      <Box sx={{ 
        p: 3, 
        textAlign: 'center',
        background: 'linear-gradient(120deg, #1976d2, #2196f3)',
        color: 'white',
        borderBottom: `1px solid ${theme.palette.divider}`
      }}>
        <Avatar 
          sx={{ 
            width: collapsed ? 40 : 64, 
            height: collapsed ? 40 : 64, 
            margin: '0 auto',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(10px)',
            border: '2px solid rgba(255, 255, 255, 0.3)'
          }}
        >
          <AdminPanelSettings fontSize={collapsed ? 'medium' : 'large'} />
        </Avatar>
        
        {!collapsed && (
          <>
            <Typography 
              variant="h6" 
              sx={{ 
                fontWeight: 700, 
                mt: 2,
                color: 'white',
                letterSpacing: 0.5
              }}
            >
              Admin Panel
            </Typography>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.85)',
                mt: 0.5
              }}
            >
              {user?.name || 'Administrator'}
            </Typography>
            <Typography 
              variant="caption" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'block',
                mt: 0.5
              }}
            >
              {user?.email }
            </Typography>
          </>
        )}
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Navigation - Added active highlighting */}
      <List sx={{ flex: 1, p: 2 }}>
        {navItems.map((item) => {
          const active = isActive(item.to);  // Check if item is active
          return (
            <ListItem 
              key={item.text} 
              disablePadding 
              sx={{ 
                mb: 1,
                '& .MuiListItemButton-root': {
                  backgroundColor: active ? theme.palette.primary.light : 'transparent',
                  color: active ? theme.palette.primary.main : theme.palette.text.secondary,
                  borderRadius: '8px',
                  margin: '4px 0',
                  '&:hover': {
                    backgroundColor: active 
                      ? theme.palette.primary.light 
                      : theme.palette.action.hover,
                  },
                }
              }}
            >
              <ListItemButton
                component={NavLink}
                to={item.to}
                sx={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 0 : 2,
                  py: 1.25
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 'auto', 
                  color: active ? theme.palette.primary.main : 'inherit',  // Icon color for active
                  mr: collapsed ? 0 : 2,
                }}>
                  {item.icon}
                </ListItemIcon>
                {!collapsed && (
                  <ListItemText 
                    primary={item.text} 
                    primaryTypographyProps={{ 
                      variant: 'body1',
                      sx: { 
                        fontWeight: active ? 600 : 500,  // Bold for active
                        color: active ? theme.palette.primary.main : 'inherit'  // Color for active
                      } 
                    }} 
                  />
                )}
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      <Divider sx={{ my: 1 }} />

      {/* Footer */}
      <Box sx={{ p: 2 }}>
        <Button
          onClick={handleLogout}
          variant="outlined"
          color="error"
          startIcon={!collapsed && <Logout />}
          fullWidth={!collapsed}
          sx={{
            justifyContent: collapsed ? 'center' : 'flex-start',
            px: collapsed ? 0 : 2,
            py: 1,
            borderRadius: '8px',
            fontWeight: 600,
            borderWidth: 1.5,
            '&:hover': {
              borderWidth: 1.5
            }
          }}
        >
          {!collapsed && 'Logout'}
        </Button>
      </Box>
    </Box>
  );
};

export default AdminSidebar;