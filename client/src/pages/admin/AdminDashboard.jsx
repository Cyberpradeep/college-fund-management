import { useEffect, useState } from 'react';
import API from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  Box, 
  Typography, 
  Card, 
  CardContent, 
  Table, 
  TableBody, 
  TableCell, 
  TableContainer, 
  TableHead, 
  TableRow, 
  Paper,
  useTheme,
  Grid,
  Stack,
  Skeleton
} from '@mui/material';
import { AccountBalance, TrendingUp, Business } from '@mui/icons-material';

const AdminDashboard = () => {
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const theme = useTheme();

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const { data } = await API.get('/departments');
      setDepartments(data);
    } catch (err) {
      console.error('Failed to fetch departments:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  const totalAllocated = departments.reduce((sum, dept) => sum + (dept.allocatedFund || 0), 0);
  const totalUtilized = departments.reduce((sum, dept) => sum + (dept.utilizedFund || 0), 0);
  const totalBalance = totalAllocated - totalUtilized;

  return (
    <AdminLayout>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Typography variant="h4" fontWeight={700} sx={{ display: 'flex', alignItems: 'center' }}>
          <Business sx={{ mr: 1.5, fontSize: 36, color: 'primary.main' }} />
          Admin Dashboard
        </Typography>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={4}>
        {[
          {
            title: "Total Allocated", 
            value: totalAllocated, 
            icon: <AccountBalance sx={{ fontSize: 28 }} />,
            color: theme.palette.primary.main,
            bg: '#f0f5ff'
          },
          {
            title: "Total Utilized", 
            value: totalUtilized, 
            icon: <AccountBalance sx={{ fontSize: 28 }} />,
            color: theme.palette.success.main,
            bg: '#f0faf5'
          },
          {
            title: "Remaining Balance", 
            value: totalBalance, 
            icon: <TrendingUp sx={{ fontSize: 28 }} />,
            color: theme.palette.warning.main,
            bg: '#fffaf0'
          }
        ].map((item, i) => (
          <Grid item xs={12} md={4} key={i}>
            <Card sx={{
              borderRadius: 3,
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
              background: item.bg,
              borderLeft: `4px solid ${item.color}`,
              transition: '0.3s',
              height: '100%',
              '&:hover': { 
                transform: 'translateY(-5px)', 
                boxShadow: '0 8px 20px rgba(0, 0, 0, 0.12)'
              }
            }}>
              <CardContent sx={{ py: 3 }}>
                <Stack direction="row" alignItems="center" spacing={2} mb={2.5}>
                  <Box sx={{
                    width: 48,
                    height: 48,
                    borderRadius: '50%',
                    backgroundColor: `${item.color}20`,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}>
                    {item.icon}
                  </Box>
                  <Typography variant="subtitle1" fontWeight={600} color="text.secondary">
                    {item.title}
                  </Typography>
                </Stack>
                
                {loading ? (
                  <Skeleton variant="text" width="80%" height={40} />
                ) : (
                  <Typography variant="h4" fontWeight={700} color={item.color}>
                    ₹{item.value.toLocaleString('en-IN')}
                  </Typography>
                )}
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Department Table */}
      <Card sx={{ 
        borderRadius: 3, 
        p: 3,
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Business sx={{ fontSize: 28, color: 'primary.main' }} />
          <Typography variant="h6" fontWeight={600}>
            Department Fund Allocation Summary
          </Typography>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table>
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Allocated (₹)</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Utilized (₹)</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Balance (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <>
                  {[...Array(5)].map((_, index) => (
                    <TableRow key={index}>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                      <TableCell><Skeleton variant="text" /></TableCell>
                    </TableRow>
                  ))}
                </>
              ) : departments.length > 0 ? (
                departments.map((dept) => {
                  const balance = (dept.allocatedFund || 0) - (dept.utilizedFund || 0);
                  return (
                    <TableRow 
                      key={dept._id}
                      hover
                      sx={{ 
                        '&:nth-of-type(odd)': { bgcolor: 'rgba(0, 0, 0, 0.02)' } 
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500 }}>{dept.name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        ₹{(dept.allocatedFund || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500 }}>
                        ₹{(dept.utilizedFund || 0).toLocaleString()}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 700,
                          color: balance < 0 ? theme.palette.error.main : 
                                  balance > 0 ? theme.palette.success.main : 'inherit'
                        }}
                      >
                        ₹{balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No department data available
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>
    </AdminLayout>
  );
};

export default AdminDashboard;