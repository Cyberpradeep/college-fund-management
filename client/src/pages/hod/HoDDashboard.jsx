import { useEffect, useState } from 'react';
import API from '../../services/api';
import HODLayout from '../../layouts/HODLayout';
import {
  Card, CardContent, Typography, Grid, Button, Box,
  Stack, LinearProgress, useTheme, Skeleton
} from '@mui/material';
import {
  AddCircleOutline, AccountBalance, Paid, Savings,
  BarChart, PieChart
} from '@mui/icons-material';
import { Link } from 'react-router-dom';

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

const HoDDashboard = () => {
  const [funds, setFunds] = useState({
    allocatedFund: 0,
    utilizedFund: 0,
    balance: 0,
  });
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const fetchFundSummary = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/reports/hod?filter=monthly');
      const { allocated, utilized, transactions } = data;

      setFunds({
        allocatedFund: allocated,
        utilizedFund: utilized,
        balance: allocated - utilized,
      });

      const chartMap = {};
      transactions.forEach(tx => {
        const month = new Date(tx.billDate).toLocaleString('default', { month: 'short' });
        chartMap[month] = (chartMap[month] || 0) + tx.amount;
      });

      setChartData(Object.entries(chartMap).map(([label, value]) => ({ label, value })));
    } catch (err) {
      console.error('Failed to load fund summary:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFundSummary();
  }, []);

  const utilizationPercentage = funds.allocatedFund > 0
    ? (funds.utilizedFund / funds.allocatedFund) * 100
    : 0;

  const barData = {
    labels: chartData.map(item => item.label),
    datasets: [{
      label: 'Monthly Expenditure (₹)',
      data: chartData.map(item => item.value),
      backgroundColor: theme.palette.primary.main,
      borderRadius: 4
    }]
  };

  const pieData = {
    labels: ['Utilized', 'Remaining'],
    datasets: [{
      data: [funds.utilizedFund, funds.balance],
      backgroundColor: [theme.palette.success.main, theme.palette.warning.main],
      borderColor: [theme.palette.success.dark, theme.palette.warning.dark],
      borderWidth: 1,
      hoverOffset: 8
    }]
  };

  return (
    <HODLayout>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={700} sx={{ display: 'flex', alignItems: 'center' }}>
          <AccountBalance sx={{ mr: 1.5, fontSize: 32, color: 'primary.main' }} />
          Department Dashboard
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddCircleOutline />}
          component={Link}
          to="/hod/upload"
          sx={{
            px: 3,
            py: 1,
            fontWeight: 600,
            borderRadius: 2,
            fontSize: '0.9rem',
            boxShadow: '0 4px 8px rgba(25, 118, 210, 0.2)',
            '&:hover': { 
              transform: 'translateY(-2px)', 
              boxShadow: '0 6px 12px rgba(25, 118, 210, 0.3)'
            }
          }}
        >
          Upload Bill
        </Button>
      </Stack>

      {/* Compact Fund Summary Cards */}
      <Grid container spacing={2} mb={3}>
        {[
          {
            label: 'Allocated', 
            icon: <AccountBalance sx={{ fontSize: 24 }} />, 
            value: funds.allocatedFund,
            color: theme.palette.primary.main, 
            bg: '#f0f5ff'
          },
          {
            label: 'Utilized', 
            icon: <Paid sx={{ fontSize: 24 }} />, 
            value: funds.utilizedFund,
            color: theme.palette.success.main, 
            bg: '#f0faf5'
          },
          {
            label: 'Balance', 
            icon: <Savings sx={{ fontSize: 24 }} />, 
            value: funds.balance,
            color: theme.palette.warning.main, 
            bg: '#fffaf0'
          }
        ].map(({ label, icon, value, color, bg }, i) => (
          <Grid item xs={12} sm={4} key={i}>
            <Card sx={{
              borderRadius: 2,
              boxShadow: '0 2px 8px rgba(0, 0, 0, 0.08)',
              background: bg,
              borderLeft: `3px solid ${color}`,
              transition: '0.3s',
              height: '100%',
            }}>
              <CardContent sx={{ py: 2, px: 2.5 }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={1}>
                  <Box sx={{
                    width: 36,
                    height: 36,
                    borderRadius: '50%',
                    backgroundColor: `${color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {icon}
                  </Box>
                  <Typography variant="subtitle2" fontWeight={600} color="text.secondary">
                    {label}
                  </Typography>
                </Stack>
                
                {loading ? (
                  <Skeleton variant="text" width="80%" height={30} />
                ) : (
                  <Typography variant="h5" fontWeight={700} color={color}>
                    ₹{value.toLocaleString('en-IN')}
                  </Typography>
                )}
                
                {label === 'Utilized' && (
                  <Box mt={2}>
                    <Stack direction="row" justifyContent="space-between" mb={0.5}>
                      <Typography variant="caption" fontWeight={500} color="text.secondary">
                        Utilization
                      </Typography>
                      <Typography variant="caption" fontWeight={600} color="success.dark">
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Chart Section - More Compact */}
      <Grid container spacing={2}>
        <Grid item xs={12} md={7}>
          <Card sx={{ 
            borderRadius: 2, 
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            height: '100%'
          }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <BarChart sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>Monthly Spending</Typography>
            </Stack>
            {loading ? (
              <Skeleton variant="rounded" width="100%" height={260} />
            ) : chartData.length > 0 ? (
              <Box sx={{ height: 260 }}>
                <Bar 
                  data={barData} 
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: { display: false }
                    },
                    scales: {
                      y: {
                        beginAtZero: true,
                        ticks: {
                          callback: (value) => '₹' + value
                        }
                      }
                    }
                  }} 
                />
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  No spending data available
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
        
        <Grid item xs={12} md={5}>
          <Card sx={{ 
            borderRadius: 2, 
            p: 2,
            border: '1px solid',
            borderColor: 'divider',
            boxShadow: '0 2px 8px rgba(0, 0, 0, 0.05)',
            height: '100%'
          }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <PieChart sx={{ fontSize: 24, color: 'primary.main' }} />
              <Typography variant="subtitle1" fontWeight={600}>Fund Allocation</Typography>
            </Stack>
            {loading ? (
              <Skeleton variant="rounded" width="100%" height={260} />
            ) : funds.allocatedFund > 0 ? (
              <Box sx={{ height: 260, position: 'relative' }}>
                <Pie 
                  data={pieData} 
                  options={{
                    maintainAspectRatio: false,
                    plugins: {
                      legend: {
                        position: 'bottom',
                        labels: {
                          padding: 15,
                          usePointStyle: true,
                          pointStyle: 'circle',
                          font: {
                            size: 10
                          }
                        }
                      },
                      tooltip: {
                        callbacks: {
                          label: (context) => {
                            const label = context.label || '';
                            const value = context.raw || 0;
                            return `${label}: ₹${value.toLocaleString()}`;
                          }
                        }
                      }
                    }
                  }} 
                />
                <Box sx={{
                  position: 'absolute',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                  textAlign: 'center'
                }}>
                  <Typography variant="body2" color="text.secondary" fontSize="0.8rem">Total</Typography>
                  <Typography variant="subtitle1" fontWeight={700}>
                    ₹{funds.allocatedFund.toLocaleString()}
                  </Typography>
                </Box>
              </Box>
            ) : (
              <Box textAlign="center" py={4}>
                <Typography variant="body2" color="text.secondary">
                  No allocation data
                </Typography>
              </Box>
            )}
          </Card>
        </Grid>
      </Grid>
    </HODLayout>
  );
};

export default HoDDashboard;
