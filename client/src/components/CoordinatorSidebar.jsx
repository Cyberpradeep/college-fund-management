
import { useLocation } from 'react-router-dom'; // Add this import
import { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { 
  List, 
  ListItemButton, 
  ListItemIcon, 
  ListItemText, 
  Typography, 
  Box, 
  Divider, 
  Avatar, 
  IconButton,
  Button
} from '@mui/material';
import { 
  Dashboard, 
  CloudUpload, 
  Receipt,
  Logout,
  ChevronLeft,
  ChevronRight,
  Person
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';
import API from '../services/api';
import { useEffect } from 'react';

const CoordinatorSidebar = ({ collapsed, toggleSidebar }) => { // Accept props
  // Remove useState for collapsed - use props instead
  const { logout, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation(); // Add this
  const theme = useTheme();
  const [departmentName, setDepartmentName] = useState('');

  useEffect(() => {
    const fetchDept = async () => {
      try {
        const res = await API.get('/reports/coordinator');
        if (res.data && res.data.department) {
          setDepartmentName(res.data.department);
        }
      } catch (err) {
        setDepartmentName('');
      }
    };
    fetchDept();
  }, []);
  
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { to: "/coordinator/dashboard", text: "Dashboard", icon: <Dashboard /> },
    { to: "/coordinator/upload", text: "Upload Bill", icon: <CloudUpload /> },
    { to: "/coordinator/transactions", text: "Transactions", icon: <Receipt /> }
  ];

  const isActive = (path) => location.pathname === path; // Use location from hook
  
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
      <IconButton 
        onClick={toggleSidebar} // Use prop instead of local function
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
          <Person fontSize={collapsed ? 'medium' : 'large'} />
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
              Coordinator Panel
            </Typography>
            <Typography 
              variant="subtitle2" 
              sx={{ 
                color: 'rgba(255, 255, 255, 0.85)',
                mt: 0.5
              }}
            >
              {user?.name || 'Coordinator'}
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

      <List sx={{ flex: 1, p: 2 }}>
        {menuItems.map((item) => {
          const active = isActive(item.to);
          return (
            <ListItemButton
              key={item.text}
              component={NavLink}
              to={item.to}
              sx={getLinkStyle(active)}
              style={{
                justifyContent: collapsed ? 'center' : 'flex-start',
                px: collapsed ? 0 : 2,
                py: 1.25,
                mb: 1
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
          );
        })}
      </List>

      <Divider sx={{ my: 1 }} />

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

export default CoordinatorSidebar;
