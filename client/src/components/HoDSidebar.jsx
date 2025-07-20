import { NavLink, useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import API from '../services/api';
import { 
  Button, 
  List, 
  ListItem, 
  ListItemButton, 
  ListItemText, 
  Typography,
  Box,
  Divider,
  Avatar,
  ListItemIcon,
  useTheme,
  useMediaQuery,
  IconButton
} from '@mui/material';
import { useEffect, useState } from 'react';
import { 
  Dashboard, 
  CloudUpload, 
  Receipt, 
  Logout,
  School,
  ChevronLeft,
  ChevronRight,
  PersonAdd
} from '@mui/icons-material';

const HODSidebar = ({ collapsed, toggleSidebar }) => {
  const { logout, user } = useAuth();
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    const fetchDept = async () => {
      try {
        const res = await API.get('/reports/hod');
        if (res.data && res.data.department) {
          setDepartmentName(res.data.department);
        }
      } catch (err) {
        setDepartmentName('');
      }
    };
    fetchDept();
  }, []);
  const navigate = useNavigate();
  const location = useLocation();
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Rearranged: Dashboard, Register Coordinator, Verify Bills, Transactions
  const menuItems = [
    { to: "/hod/dashboard", text: "Dashboard", icon: <Dashboard /> },
    { to: "/hod/register-coordinator", text: "Register Coordinator", icon: <PersonAdd /> },
    { to: "/hod/verify-bills", text: "Verify Bills", icon: <Receipt /> },
    { to: "/hod/transactions", text: "Transactions", icon: <Receipt /> },
  ];

  // Get active state based on current URL
  const isActive = (path) => {
    return location.pathname === path;
  };

  // Link styling based on active state
  const getLinkStyle = (active) => ({
    backgroundColor: active ? theme.palette.primary.light : 'transparent',
    color: active ? theme.palette.primary.main : theme.palette.text.secondary,
    borderRadius: '8px',
    margin: '4px 0',
    '&:hover': {
      backgroundColor: active 
        ? theme.palette.primary.light 
        : theme.palette.action.hover,
    },
  });

  const sidebarWidth = collapsed ? 80 : 250;

  return (
    <Box 
      sx={{
        width: sidebarWidth,
        backgroundColor: '#f8fafc',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)',
        position: 'fixed',
        left: 0,
        top: 0,
        bottom: 0,
        zIndex: 100,
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

      {/* Header */}
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
          <School fontSize={collapsed ? 'medium' : 'large'} />
        </Avatar>
        {!collapsed && (
          <>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.95)',
                mt: 2,
                fontWeight: 700,
                letterSpacing: 0.5,
                fontSize: '1.1rem',
                wordBreak: 'break-all',
              }}
            >
              {user?.name || 'Department Head'}
            </Typography>
            <Typography
              variant="caption"
              sx={{
                color: 'rgba(255, 255, 255, 0.7)',
                display: 'block',
                mt: 0.5
              }}
            >
              {departmentName || 'Department'}
            </Typography>
          </>
        )}
      </Box>

      <Divider sx={{ my: 1 }} />

      {/* Navigation */}
      <List sx={{ flex: 1, p: 2 }}>
        {menuItems.map((item) => {
          const active = isActive(item.to);
          return (
            <ListItem 
              key={item.text} 
              disablePadding 
              sx={{ mb: 1 }}
            >
              <ListItemButton
                component={NavLink}
                to={item.to}
                sx={getLinkStyle(active)}
                style={{
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  px: collapsed ? 0 : 2,
                  py: 1.25
                }}
              >
                <ListItemIcon sx={{ 
                  minWidth: 'auto', 
                  color: active ? theme.palette.primary.main : 'inherit',
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
                        fontWeight: active ? 600 : 500,
                        color: active ? theme.palette.primary.main : 'inherit'
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

export default HODSidebar;