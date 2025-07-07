import { useEffect, useState } from 'react';
import API from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Typography,
  Select,
  MenuItem,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Paper,
  Button,
  Stack,
  Box,
  Grid,
  useTheme,
  TableContainer,
  Card,
  CardContent
} from '@mui/material';
import { Download } from '@mui/icons-material';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  BarElement,
  CategoryScale,
  LinearScale
} from 'chart.js';

ChartJS.register(ArcElement, Tooltip, Legend, BarElement, CategoryScale, LinearScale);

// 🔐 Secure PDF downloader with auth
const downloadProtectedPDF = async (url, filename = 'report.pdf') => {
  const token = JSON.parse(localStorage.getItem('user'))?.token;

  if (!token) return alert('Auth token missing');

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!res.ok) return alert('Failed to download');

  const blob = await res.blob();
  const link = document.createElement('a');
  link.href = window.URL.createObjectURL(blob);
  link.download = filename;
  link.click();
};

const Reports = () => {
  const theme = useTheme();
  const [filterOverall, setFilterOverall] = useState('monthly');
  const [filterDept, setFilterDept] = useState('monthly');
  const [reports, setReports] = useState([]);
  const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchReports = async () => {
    try {
      const { data } = await API.get(`/reports/admin?filter=${filterDept}`);
      setReports(data);
    } catch (err) {
      console.error('Error fetching report:', err.message);
    }
  };

  useEffect(() => {
    fetchReports();
  }, [filterDept]);

  const combined = reports.reduce(
    (acc, d) => {
      acc.allocated += d.allocated || 0;
      acc.utilized += d.utilized || 0;
      acc.bills += d.transactions?.length || 0;
      return acc;
    },
    { allocated: 0, utilized: 0, bills: 0 }
  );
  combined.balance = combined.allocated - combined.utilized;

  // 📊 Doughnut Data
  const overallChartData = {
    labels: ['Allocated', 'Utilized', 'Balance'],
    datasets: [
      {
        data: [
          combined.allocated,
          combined.utilized,
          combined.balance
        ],
        backgroundColor: [
          theme.palette.primary.main,
          theme.palette.success.main,
          theme.palette.warning.main
        ],
        borderWidth: 1,
      },
    ],
  };

  // 📊 Department Bar Chart
  const deptChartData = {
    labels: reports.map(d => d.name),
    datasets: [
      {
        label: 'Allocated',
        data: reports.map(d => d.allocated),
        backgroundColor: theme.palette.primary.main
      },
      {
        label: 'Utilized',
        data: reports.map(d => d.utilized),
        backgroundColor: theme.palette.success.main
      },
      {
        label: 'Balance',
        data: reports.map(d => d.allocated - d.utilized),
        backgroundColor: theme.palette.warning.main
      }
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { 
      legend: { 
        position: 'top',
        labels: {
          font: {
            family: theme.typography.fontFamily,
            size: 13
          }
        } 
      } 
    },
  };

  return (
    <AdminLayout>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>
          Financial Reports
        </Typography>
      </Stack>

      {/* 🔢 Overall Summary Section */}
      <Card sx={{ mb: 4, borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight={600}>
              Overall Financial Summary
            </Typography>
            <Select
              size="small"
              value={filterOverall}
              onChange={(e) => setFilterOverall(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </Stack>

          <TableContainer>
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Total Allocated</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Total Utilized</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Remaining Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }}>Total Bills</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Export</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                <TableRow>
                  <TableCell>₹{combined.allocated.toLocaleString()}</TableCell>
                  <TableCell>₹{combined.utilized.toLocaleString()}</TableCell>
                  <TableCell>₹{combined.balance.toLocaleString()}</TableCell>
                  <TableCell>{combined.bills}</TableCell>
                  <TableCell align="center">
                    <Button
                      variant="contained"
                      size="small"
                      startIcon={<Download />}
                      onClick={() =>
                        downloadProtectedPDF(
                          `${BASE}/reports/admin/export?filter=${filterOverall}`,
                          `Overall_Report_${filterOverall}.pdf`
                        )
                      }
                      sx={{ minWidth: 140 }}
                    >
                      Export PDF
                    </Button>
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          </TableContainer>

          {/* Centered Doughnut Chart */}
          <Grid container justifyContent="center">
            <Grid item xs={12} md={6}>
              <Box 
                sx={{ 
                  p: 3, 
                  bgcolor: theme.palette.grey[50], 
                  borderRadius: 3,
                  height: 300,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}
              >
                <Typography variant="subtitle1" fontWeight={600} mb={2}>
                  Financial Distribution
                </Typography>
                <Box sx={{ width: '100%', height: '100%' }}>
                  <Doughnut 
                    data={overallChartData} 
                    options={{
                      ...chartOptions,
                      plugins: {
                        legend: {
                          position: 'bottom',
                          labels: {
                            padding: 15,
                            usePointStyle: true,
                            font: {
                              size: 12
                            }
                          }
                        }
                      }
                    }} 
                  />
                </Box>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* 🏢 Department-Wise Report Section */}
      <Card sx={{ borderRadius: 3, boxShadow: 3 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Typography variant="h6" fontWeight={600}>
              Departmental Reports
            </Typography>
            <Select
              size="small"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              sx={{ minWidth: 120 }}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </Stack>

          <TableContainer>
            <Table size="small" sx={{ mb: 3 }}>
              <TableHead>
                <TableRow sx={{ bgcolor: theme.palette.grey[100] }}>
                  <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Allocated</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Utilized</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Balance</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="right">Bills</TableCell>
                  <TableCell sx={{ fontWeight: 600 }} align="center">Export</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.map((dept) => (
                  <TableRow 
                    key={dept._id || dept.name}
                    hover
                    sx={{ '&:hover': { backgroundColor: theme.palette.action.hover } }}
                  >
                    <TableCell>{dept.name}</TableCell>
                    <TableCell align="right">₹{dept.allocated.toLocaleString()}</TableCell>
                    <TableCell align="right">₹{dept.utilized.toLocaleString()}</TableCell>
                    <TableCell align="right">₹{(dept.allocated - dept.utilized).toLocaleString()}</TableCell>
                    <TableCell align="right">{dept.transactions?.length || 0}</TableCell>
                    <TableCell align="center">
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<Download />}
                        onClick={() =>
                          downloadProtectedPDF(
                            `${BASE}/departments/report/${dept._id}/pdf?filter=${filterDept}`,
                            `${dept.name}_Report_${filterDept}.pdf`
                          )
                        }
                        sx={{ minWidth: 90 }}
                      >
                        PDF
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>

          {/* Department chart */}
          <Box mt={4} sx={{ p: 3, bgcolor: theme.palette.grey[50], borderRadius: 3 }}>
            <Typography variant="subtitle1" fontWeight={600} mb={2} textAlign="center">
              Departmental Financial Analysis
            </Typography>
            <Box sx={{ height: 400 }}>
              <Bar 
                data={deptChartData} 
                options={{
                  ...chartOptions,
                  scales: {
                    x: {
                      grid: {
                        display: false
                      }
                    },
                    y: {
                      beginAtZero: true,
                      ticks: {
                        callback: function(value) {
                          return '₹' + value.toLocaleString();
                        }
                      }
                    }
                  },
                  plugins: {
                    legend: {
                      position: 'top',
                      labels: {
                        usePointStyle: true,
                      }
                    }
                  }
                }} 
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default Reports;