import { useEffect, useState } from 'react';
import API from '../../services/api';
import HODLayout from '../../layouts/HODLayout';
import {
  Card, CardContent, Typography, Grid, Box,
  Stack, LinearProgress, useTheme, Skeleton
} from '@mui/material';
import {
  AccountBalance, Paid, Savings,
  BarChart, Person
} from '@mui/icons-material';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { useAuth } from '../../context/AuthContext';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const HoDDashboard = () => {
  const { user } = useAuth();
  const [funds, setFunds] = useState({
    allocatedFund: 0,
    utilizedFund: 0,
    balance: 0,
  });
  const [currentAllocation, setCurrentAllocation] = useState(null);
  const [departmentName, setDepartmentName] = useState('');
  const [coordinator, setCoordinator] = useState(null);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const fetchFundSummary = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/reports/hod');
      console.log('HOD Dashboard API response:', data);
      
      // Handle different possible response structures for backward compatibility
      const allocated = data.allocated || data.allocatedFund || data.allocatedFunds || 0;
      const utilized = data.utilized || data.utilizedFund || data.utilizedFunds || 0;
      const currentAllocation = data.currentAllocation || data.alloc || null;
      const department = data.department || 'Department';

      setFunds({
        allocatedFund: allocated,
        utilizedFund: utilized,
        balance: allocated - utilized,
      });
      setCurrentAllocation(currentAllocation);
      setDepartmentName(department);
    } catch (err) {
      console.error('Failed to load fund summary:', err);
      // Set default values on error
      setFunds({
        allocatedFund: 0,
        utilizedFund: 0,
        balance: 0,
      });
      setDepartmentName('Department');
    } finally {
      setLoading(false);
    }
  };

  const fetchCoordinatorDetails = async () => {
    try {
      const { data } = await API.get('/departments/hod/coordinator');
      setCoordinator(data);
    } catch (err) {
      console.error('Failed to fetch coordinator details:', err);
    }
  };

  useEffect(() => {
    fetchFundSummary();
    fetchCoordinatorDetails();
  }, []);

  const utilizationPercentage = funds.allocatedFund > 0
    ? (funds.utilizedFund / funds.allocatedFund) * 100
    : 0;

  // Notification logic
  let notification = null;
  if (currentAllocation && currentAllocation.startDate && currentAllocation.endDate) {
    const start = new Date(currentAllocation.startDate);
    const end = new Date(currentAllocation.endDate);
    const today = new Date();
    const daysLeft = Math.max(0, Math.ceil((end - today) / (1000 * 60 * 60 * 24)));
    notification = (
      <Card sx={{ 
        mb: 3, 
        borderRadius: 2, 
        background: '#fffbe6', 
        borderLeft: '4px solid #ffb300', 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        width: '100%'
      }}>
        <CardContent>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={1.5}>
            <Box sx={{
              width: 36,
              height: 36,
              borderRadius: '50%',
              backgroundColor: '#fff3cd',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <BarChart sx={{ color: '#ffb300' }} />
            </Box>
            <Typography variant="subtitle1" fontWeight={700} color="text.primary">
              Semester Upload Window
            </Typography>
          </Stack>
          
          <Grid container spacing={1}>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight={600}>Semester:</Box> {currentAllocation?.semester || '-'} {currentAllocation?.year || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight={600}>Budget:</Box> ₹{currentAllocation.amount?.toLocaleString('en-IN') || '-'}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight={600}>Period:</Box> {start.toLocaleDateString()} - {end.toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body2" color="text.secondary">
                <Box component="span" fontWeight={600}>Days Left:</Box> 
                <Box component="span" color={daysLeft < 7 ? 'error.main' : 'success.main'} ml={0.5}>
                  {daysLeft} day{daysLeft !== 1 ? 's' : ''}
                </Box>
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    );
  } else {
    notification = (
      <Card sx={{ 
        mb: 3, 
        borderRadius: 2, 
        background: '#fffbe6', 
        borderLeft: '4px solid #ffb300', 
        boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
        width: '100%'
      }}>
        <CardContent>
          <Typography variant="subtitle1" fontWeight={700} color="warning.main" gutterBottom>
            No active fund allocation for this semester.
          </Typography>
        </CardContent>
      </Card>
    );
  }

  return (
    <HODLayout>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3} flexWrap="wrap">
        <AccountBalance sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1 }}>
          {departmentName} Dashboard
        </Typography>
      </Stack>

      {/* Notification Section - Full Width */}
      {notification}

      {/* Responsive Profile Cards Row - HOD and Coordinator side by side on md+, stacked on sm */}
      <Grid container spacing={3} justifyContent="center" alignItems="stretch" mb={4}>
        <Grid item xs={12} sm={8} md={5} lg={4} display="flex" justifyContent="center">
          <Card sx={{
            borderRadius: 3,
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.06)',
            background: '#fcfcfc',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            width: '100%',
            minWidth: 0
          }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Person sx={{ fontSize: 38, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>HOD Profile</Typography>
              <Typography><strong>Name:</strong> {user?.name || '-'}</Typography>
              <Typography><strong>Email:</strong> {user?.email || '-'}</Typography>
            </Box>
          </Card>
        </Grid>
        <Grid item xs={12} sm={8} md={5} lg={4} display="flex" justifyContent="center">
          <Card sx={{
            borderRadius: 3,
            p: 3,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 4px 16px rgba(25, 118, 210, 0.06)',
            background: '#fcfcfc',
            display: 'flex',
            alignItems: 'center',
            gap: 3,
            width: '100%',
            minWidth: 0
          }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: theme.palette.primary.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Person sx={{ fontSize: 38, color: 'primary.main' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Coordinator Profile</Typography>
              {loading ? (
                <>
                  <Skeleton variant="text" width="80%" height={24} mb={1.5} />
                  <Skeleton variant="text" width="60%" height={24} />
                </>
              ) : coordinator ? (
                <>
                  <Typography><strong>Name:</strong> {coordinator.name || '-'}</Typography>
                  <Typography><strong>Email:</strong> {coordinator.email || '-'}</Typography>
                </>
              ) : (
                <Typography color="text.secondary">No coordinator registered for this department.</Typography>
              )}
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Fund Summary Cards Row - placed below profile cards */}
      <Grid container spacing={3} justifyContent="center" alignItems="stretch" mb={3}>
        {[
          {
            title: 'Allocated Fund',
            value: funds.allocatedFund,
            icon: <AccountBalance sx={{ fontSize: 22 }} />, 
            color: theme.palette.primary.main,
            bg: '#f5f8ff'
          },
          {
            title: 'Utilized Fund',
            value: funds.utilizedFund,
            icon: <Paid sx={{ fontSize: 22 }} />, 
            color: theme.palette.success.main,
            bg: '#e8f5e9'
          },
          {
            title: 'Available Balance',
            value: funds.balance,
            icon: <Savings sx={{ fontSize: 22 }} />, 
            color: theme.palette.warning.main,
            bg: '#fffaf5'
          }
        ].map((item, i) => (
          <Grid item xs={12} sm={6} md={4} key={i} display="flex" justifyContent="center" alignItems="stretch">
            <Card sx={{
              width: '100%',
              minWidth: 240,
              maxWidth: 400,
              borderRadius: 3,
              boxShadow: '0 2px 16px 0 rgba(25, 118, 210, 0.10), 0 0 16px 2px ' + item.color + '22',
              background: item.bg,
              borderLeft: `4px solid ${item.color}`,
              transition: '0.3s',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              alignItems: 'center',
              '&:hover': { 
                transform: 'translateY(-3px)', 
                boxShadow: '0 4px 24px 0 ' + item.color + '44, 0 0 24px 4px ' + item.color + '33'
              }
            }}>
              <CardContent sx={{ py: 2.5, px: 2, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2} sx={{ width: '100%', justifyContent: 'center' }}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: `${item.color}22`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ letterSpacing: 0.2 }}>
                    {item.title}
                  </Typography>
                </Stack>
                <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                  {loading ? (
                    <Skeleton variant="text" width="80%" height={30} sx={{ mx: 'auto' }} />
                  ) : (
                    <Typography variant="h6" fontWeight={700} color={item.color} sx={{ letterSpacing: 0.5, textAlign: 'center' }}>
                      ₹{(item.value || 0).toLocaleString('en-IN')}
                    </Typography>
                  )}
                  {item.title === 'Utilized Fund' && (
                    <Box mt={2} sx={{ width: '90%' }}>
                      <Stack direction="row" justifyContent="space-between" mb={0.5}>
                        <Typography variant="caption" fontWeight={500} color="text.secondary">
                          Utilization
                        </Typography>
                        <Typography variant="caption" fontWeight={600} color={theme.palette.success.main}>
                          {utilizationPercentage.toFixed(1)}%
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={utilizationPercentage}
                        sx={{
                          height: 8,
                          borderRadius: 3,
                          backgroundColor: theme.palette.grey[200],
                          '& .MuiLinearProgress-bar': {
                            borderRadius: 3,
                            background: `linear-gradient(90deg, ${theme.palette.success.light}, ${theme.palette.success.dark})`
                          }
                        }}
                      />
                    </Box>
                  )}
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      
      {/* Fallback for no funds allocated */}
      {(!loading && funds.allocatedFund === 0 && funds.utilizedFund === 0 && funds.balance === 0) && (
        <Box textAlign="center" mt={2}>
          <Typography color="text.secondary" fontWeight={500}>
            No funds allocated yet for your department.
          </Typography>
        </Box>
      )}
    </HODLayout>
  );
};

export default HoDDashboard;