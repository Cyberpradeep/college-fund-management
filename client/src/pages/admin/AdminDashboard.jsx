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
import { useAuth } from '../../context/AuthContext';

const AdminDashboard = () => {
  const { user } = useAuth();
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
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Business sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
          Admin Dashboard
        </Typography>
      </Stack>

      {/* Summary Cards - match Coordinator/HOD style */}
      <Grid container spacing={3} mb={4} justifyContent="center" alignItems="stretch">
        {[
          {
            title: "Total Allocated", 
            value: totalAllocated, 
            icon: <AccountBalance sx={{ fontSize: 22 }} />, 
            color: theme.palette.primary.main,
            bg: '#f5f8ff'
          },
          {
            title: "Total Utilized", 
            value: totalUtilized, 
            icon: <AccountBalance sx={{ fontSize: 22 }} />, 
            color: theme.palette.success.main,
            bg: '#f5fcf7'
          },
          {
            title: "Remaining Balance", 
            value: totalBalance, 
            icon: <TrendingUp sx={{ fontSize: 22 }} />, 
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
                {loading ? (
                  <Skeleton variant="text" width="80%" height={28} />
                ) : (
                  <Typography variant="h6" fontWeight={700} color={item.color} sx={{ letterSpacing: 0.5, textAlign: 'center' }}>
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
        boxShadow: '0 4px 16px rgba(25, 118, 210, 0.06)',
        background: '#fcfcfc'
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
          <Business sx={{ fontSize: 22, color: 'primary.main' }} />
          <Typography variant="subtitle1" fontWeight={700} letterSpacing={0.2}>
            Department Fund Allocation Summary
          </Typography>
        </Stack>
        <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 3, boxShadow: '0 2px 8px rgba(0,0,0,0.06)', border: '1.5px solid #d1d5db' }}>
          <Table sx={{
            borderCollapse: 'separate',
            borderSpacing: 0,
            '& th, & td': {
              border: 'none',
            },
            '& thead th': {
              backgroundColor: '#f7f9fa',
              fontWeight: 700,
              fontSize: 13,
              color: '#222',
              borderBottom: '2px solid #d1d5db',
            },
            '& tbody tr': {
              transition: 'background 0.2s',
            },
            '& tbody tr:nth-of-type(even)': {
              backgroundColor: '#f4f6f8',
            },
            '& tbody tr:hover': {
              backgroundColor: '#e3e8ef',
            },
          }}>
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell align="right">Allocated (₹)</TableCell>
                <TableCell align="right">Utilized (₹)</TableCell>
                <TableCell align="right">Balance (₹)</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                [...Array(5)].map((_, index) => (
                  <TableRow key={index}>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                    <TableCell><Skeleton variant="text" /></TableCell>
                  </TableRow>
                ))
              ) : departments.length > 0 ? (
                departments.map((dept, idx) => {
                  const balance = (dept.allocatedFund || 0) - (dept.utilizedFund || 0);
                  return (
                    <TableRow 
                      key={dept._id}
                      hover
                      sx={{ 
                        bgcolor: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'white',
                        transition: 'background 0.2s',
                        '&:hover': { bgcolor: 'primary.lighter' }
                      }}
                    >
                      <TableCell sx={{ fontWeight: 500, fontSize: 13 }}>{dept.name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500, fontSize: 13 }}>
                        ₹{(dept.allocatedFund || 0).toLocaleString()}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 500, fontSize: 13 }}>
                        ₹{(dept.utilizedFund || 0).toLocaleString()}
                      </TableCell>
                      <TableCell 
                        align="right" 
                        sx={{ 
                          fontWeight: 700,
                          color: balance < 0 ? 'error.main' : 'success.main',
                          fontSize: 13
                        }}
                      >
                        ₹{balance.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    <Typography variant="body2" color="text.secondary" py={2}>
                      No departments found.
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