
import React, { useEffect, useState } from 'react';
import API from '../../services/api';
import { Box, Typography, Card, CardContent, Grid, CircularProgress, Stack, Chip } from '@mui/material';
import CoordinatorLayout from '../../layouts/CoordinatorLayout';
import { useAuth } from '../../context/AuthContext';
import { AccountCircle, AccountBalanceWallet, TrendingUp, MonetizationOn } from '@mui/icons-material';
import { useTheme } from '@mui/material';

const CoordinatorDashboard = () => {
  const theme = useTheme();
  const { user } = useAuth();
  const [funds, setFunds] = useState({ allocated: 0, utilized: 0, balance: 0 });
  const [summary, setSummary] = useState({ total: 0, pending: 0, verified: 0, rejected: 0 });
  const [loading, setLoading] = useState(true);
  const [daysLeft, setDaysLeft] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        // Fetch fund status from Coordinator report endpoint (Coordinator's department)
        const { data: fundData } = await API.get('/reports/coordinator');
        setFunds({
          allocated: fundData.allocatedFunds || 0,
          utilized: fundData.utilizedFunds || 0,
          balance: (fundData.allocatedFunds || 0) - (fundData.utilizedFunds || 0),
        });
        // Calculate days left for current semester's allocation
        if (fundData.fundAllocations && fundData.fundAllocations.length > 0) {
          const today = new Date();
          // Find the allocation period that includes today
          const currentAlloc = fundData.fundAllocations.find(alloc => {
            const start = new Date(alloc.startDate);
            const end = new Date(alloc.endDate);
            return today >= start && today <= end;
          });
          if (currentAlloc) {
            const end = new Date(currentAlloc.endDate);
            const diff = Math.ceil((end - today) / (1000 * 60 * 60 * 24));
            setDaysLeft(diff >= 0 ? diff : 0);
          } else {
            setDaysLeft(null);
          }
        }
        // Fetch uploads summary
        const { data: txs } = await API.get('/transactions/my');
        const summary = { total: txs.length, pending: 0, verified: 0, rejected: 0 };
        txs.forEach(tx => {
          if (tx.status === 'pending') summary.pending++;
          if (tx.status === 'verified') summary.verified++;
          if (tx.status === 'rejected') summary.rejected++;
        });
        setSummary(summary);
      } catch (err) {
        // Optionally show error
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  return (
    <CoordinatorLayout>
      {/* Heading with icon */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <AccountBalanceWallet sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
          Coordinator Dashboard
        </Typography>
      </Stack>

      {/* Profile Card */}
      <Card sx={{
        borderRadius: 3,
        p: 3,
        mb: 4,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.06)',
        background: '#fcfcfc',
        display: 'flex',
        alignItems: 'center',
        gap: 3
      }}>
        <Box sx={{
          width: 60,
          height: 60,
          borderRadius: '50%',
          backgroundColor: theme.palette.primary.light,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2
        }}>
          <AccountCircle sx={{ fontSize: 38, color: 'primary.main' }} />
        </Box>
        <Box>
          <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Coordinator Profile</Typography>
          <Typography><strong>Name:</strong> {user?.name || '-'}</Typography>
          <Typography><strong>Email:</strong> {user?.email || '-'}</Typography>
          {daysLeft !== null && (
            <Typography sx={{ mt: 1, color: daysLeft <= 7 ? 'error.main' : 'success.main', fontWeight: 600 }}>
              <strong>
                {daysLeft > 0
                  ? `Days left to upload bills: ${daysLeft}`
                  : 'No active fund allocation period'}
              </strong>
            </Typography>
          )}
        </Box>
      </Card>

      {/* Fund Summary Cards */}
      <Grid container spacing={3} mb={4} justifyContent="center" alignItems="stretch">
        {[
          {
            title: 'Allocated Fund',
            value: funds.allocated,
            icon: <MonetizationOn sx={{ fontSize: 22 }} />, 
            color: theme.palette.primary.main,
            bg: '#f5f8ff'
          },
          {
            title: 'Utilized Fund',
            value: funds.utilized,
            icon: <TrendingUp sx={{ fontSize: 22 }} />, 
            color: theme.palette.success.main,
            bg: '#f5fcf7'
          },
          {
            title: 'Available Balance',
            value: funds.balance,
            icon: <AccountBalanceWallet sx={{ fontSize: 22 }} />, 
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
              <CardContent sx={{ py: 2, px: 1.5, width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                <Stack direction="row" alignItems="center" justifyContent="center" spacing={1.2} mb={1.5} sx={{ width: '100%' }}>
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
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary" sx={{ letterSpacing: 0.2, textAlign: 'center' }}>
                    {item.title}
                  </Typography>
                </Stack>
                <Typography variant="h6" fontWeight={700} color={item.color} sx={{ letterSpacing: 0.5, textAlign: 'center' }}>
                  ₹{item.value.toLocaleString('en-IN')}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Uploads Summary */}
      <Card sx={{
        borderRadius: 3,
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.06)',
        background: '#fcfcfc',
        mb: 2
      }}>
        <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.2} mb={2} align="center">
          My Uploads Summary
        </Typography>
        <Grid container spacing={2} justifyContent="center" alignItems="stretch">
          <Grid item xs={6} sm={3}>
            <Box sx={{
              bgcolor: 'primary.light',
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(25, 118, 210, 0.06)',
              mx: 'auto',
              minWidth: 100,
              maxWidth: 180
            }}>
              <Typography variant="h6" color="primary.main" fontWeight={700}>
                {summary.total}
              </Typography>
              <Typography variant="body1">Total</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{
              bgcolor: 'warning.light',
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(255, 193, 7, 0.06)',
              mx: 'auto',
              minWidth: 100,
              maxWidth: 180
            }}>
              <Typography variant="h6" color="warning.main" fontWeight={700}>
                {summary.pending}
              </Typography>
              <Typography variant="body1">Pending</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{
              bgcolor: 'success.light',
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(76, 175, 80, 0.06)',
              mx: 'auto',
              minWidth: 100,
              maxWidth: 180
            }}>
              <Typography variant="h6" color="success.main" fontWeight={700}>
                {summary.verified}
              </Typography>
              <Typography variant="body1">Verified</Typography>
            </Box>
          </Grid>
          <Grid item xs={6} sm={3}>
            <Box sx={{
              bgcolor: 'error.light',
              borderRadius: 2,
              p: 2,
              textAlign: 'center',
              boxShadow: '0 1px 4px rgba(244, 67, 54, 0.06)',
              mx: 'auto',
              minWidth: 100,
              maxWidth: 180
            }}>
              <Typography variant="h6" color="error.main" fontWeight={700}>
                {summary.rejected}
              </Typography>
              <Typography variant="body1">Rejected</Typography>
            </Box>
          </Grid>
        </Grid>
      </Card>
      {loading && (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress size={60} /></Box>
      )}
    </CoordinatorLayout>
  );
};

export default CoordinatorDashboard;
