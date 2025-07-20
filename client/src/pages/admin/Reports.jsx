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
  CardContent,
  TextField,
  FormControl,
  InputLabel
} from '@mui/material';
import { BarChart, Assessment } from '@mui/icons-material';
import { Download } from '@mui/icons-material';
import { Bar, Doughnut } from 'react-chartjs-2';
import dayjs from 'dayjs';
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
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('');
  const [semester, setSemester] = useState('');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [transactions, setTransactions] = useState([]);
  const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  // Add a department selector for charts
  const [chartDepartment, setChartDepartment] = useState('');

  // Add separate filter state for department chart and overall chart
  const [deptChartFilters, setDeptChartFilters] = useState({ semester: '', date: '', month: '', year: '', department: '' });
  const [overallChartFilters, setOverallChartFilters] = useState({ semester: '', date: '', month: '', year: '' });
  const [deptChartData, setDeptChartData] = useState(null);
  const [overallChartData, setOverallChartData] = useState(null);

  // Filtered data for selected department or all
  const selectedDept = chartDepartment
    ? reports.find(d => d._id === chartDepartment)
    : null;

  // 📊 Doughnut Data
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

  // Chart data for selected department or all
  const chartData = selectedDept
    ? {
        labels: ['Allocated', 'Utilized', 'Balance'],
        datasets: [
          {
            data: [selectedDept.allocated, selectedDept.utilized, selectedDept.allocated - selectedDept.utilized],
            backgroundColor: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main],
            borderWidth: 1,
          },
        ],
      }
    : overallChartData;

  const fetchDepartments = async () => {
    const { data } = await API.get('/departments');
    setDepartments(data);
  };

  const fetchReports = async () => {
    try {
      const { data } = await API.get(`/reports/admin?filter=${filterDept}`);
      setReports(data);
    } catch (err) {
      console.error('Error fetching report:', err.message);
    }
  };

  const fetchTransactions = async () => {
    let url = '/transactions';
    const params = [];
    if (department) params.push(`department=${department}`);
    if (semester) params.push(`semester=${semester}`);
    if (date) params.push(`date=${date}`);
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (params.length) url += '?' + params.join('&');
    const { data } = await API.get(url);
    setTransactions(data);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchReports();
  }, [filterDept]);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [department, semester, date, month, year]);

  // Fetch department chart data when filters change
  useEffect(() => {
    const fetchDeptChartData = async () => {
      let url = `/reports/admin?department=${deptChartFilters.department}`;
      const params = [];
      if (deptChartFilters.semester) params.push(`semester=${deptChartFilters.semester}`);
      if (deptChartFilters.date) params.push(`date=${deptChartFilters.date}`);
      if (deptChartFilters.month) params.push(`month=${deptChartFilters.month}`);
      if (deptChartFilters.year) params.push(`year=${deptChartFilters.year}`);
      if (params.length) url += '&' + params.join('&');
      const { data } = await API.get(url);
      console.log('Dept Chart API response:', data, 'Selected department:', deptChartFilters.department);
      // Build chart data for selected department
      const selected = deptChartFilters.department
        ? data.find(d => String(d._id) === String(deptChartFilters.department))
        : null;
      setDeptChartData(selected ? {
        labels: ['Allocated', 'Utilized', 'Balance'],
        datasets: [
          {
            data: [selected.allocated, selected.utilized, selected.allocated - selected.utilized],
            backgroundColor: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main],
            borderWidth: 1,
          },
        ],
      } : null);
    };
    fetchDeptChartData();
  }, [deptChartFilters, theme.palette]);

  // Fetch overall chart data when filters change
  useEffect(() => {
    const fetchOverallChartData = async () => {
      let url = `/reports/admin`;
      const params = [];
      if (overallChartFilters.semester) params.push(`semester=${overallChartFilters.semester}`);
      if (overallChartFilters.date) params.push(`date=${overallChartFilters.date}`);
      if (overallChartFilters.month) params.push(`month=${overallChartFilters.month}`);
      if (overallChartFilters.year) params.push(`year=${overallChartFilters.year}`);
      if (params.length) url += '?' + params.join('&');
      const { data } = await API.get(url);
      // Build overall chart data
      const combined = data.reduce((acc, d) => {
        acc.allocated += d.allocated || 0;
        acc.utilized += d.utilized || 0;
        return acc;
      }, { allocated: 0, utilized: 0 });
      const balance = combined.allocated - combined.utilized;
      setOverallChartData({
        labels: ['Allocated', 'Utilized', 'Balance'],
        datasets: [
          {
            data: [combined.allocated, combined.utilized, balance],
            backgroundColor: [theme.palette.primary.main, theme.palette.success.main, theme.palette.warning.main],
            borderWidth: 1,
          },
        ],
      });
    };
    fetchOverallChartData();
  }, [overallChartFilters, theme.palette]);

  const downloadTransactionsPDF = async () => {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    let url = `${BASE}/reports/admin/export`;
    const params = [];
    if (department) params.push(`department=${department}`);
    if (semester) params.push(`semester=${semester}`);
    if (date) params.push(`date=${date}`);
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (params.length) url += '?' + params.join('&');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return alert('Failed to download PDF');
    const blob = await res.blob();
    const urlObj = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `transactions_report.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const downloadTransactionsExcel = async () => {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    let url = `${BASE}/transactions/export/excel`;
    const params = [];
    if (department) params.push(`department=${department}`);
    if (semester) params.push(`semester=${semester}`);
    if (date) params.push(`date=${date}`);
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (params.length) url += '?' + params.join('&');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return alert('Failed to download Excel');
    const blob = await res.blob();
    const urlObj = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `transactions_report.xlsx`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const handleDownloadBill = async (txId) => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const downloadUrl = `${BASE}/transactions/download/${txId}`;
      console.log('🔗 Download URL:', downloadUrl);
      
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('📥 Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ Download error response:', errorText);
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill_${txId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      console.error('Download failed:', error);
      alert('Failed to download bill. Please try again.');
    }
  };

  // 📊 Department Bar Chart
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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={4}>
        <Stack direction="row" alignItems="center" spacing={1}>
          <Assessment sx={{ color: 'primary.main', fontSize: 32 }} />
          <Typography variant="h5" fontWeight={800} sx={{ letterSpacing: 1 }}>
            Financial Reports
          </Typography>
        </Stack>
      </Stack>

      {/* Add filter controls above Departmental Reports table */}
      <Card sx={{ mb: 4, borderRadius: 4, boxShadow: '0 4px 16px rgba(25, 118, 210, 0.08)', background: '#f8faff' }}>
        <CardContent>
          <Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" sx={{ fontFamily: 'inherit' }}>
            <Stack direction="row" spacing={2} alignItems="center">
              <TextField label="Semester" value={semester} onChange={e => setSemester(e.target.value)} select sx={{ minWidth: 120 }}>
                <MenuItem value="">All</MenuItem>
                {[...Array(8)].map((_, i) => (
                  <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                ))}
              </TextField>
              <TextField label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} InputLabelProps={{ shrink: true }} />
              <TextField label="Month" type="month" value={month} onChange={e => setMonth(e.target.value)} />
              <TextField label="Year" type="number" value={year} onChange={e => setYear(e.target.value)} placeholder="e.g. 2024" />
            </Stack>
            <Button variant="contained" startIcon={<Download />} onClick={() => downloadProtectedPDF(`${BASE}/reports/admin/export?semester=${semester}&date=${date}&month=${month}&year=${year}`, `Full_Report.pdf`)} sx={{ fontWeight: 700, fontSize: 15, borderRadius: 2, px: 3, py: 1.5, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)' }}>Full Export PDF</Button>
          </Stack>
        </CardContent>
      </Card>

      {/* Departmental Reports Table (now at the top) */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 6px 24px rgba(25, 118, 210, 0.08)', background: '#fcfcfc', mb: 5 }}>
        <CardContent>
          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
            <Stack direction="row" alignItems="center" spacing={1}>
              <BarChart sx={{ color: 'primary.main', fontSize: 28 }} />
              <Typography variant="h6" fontWeight={800} sx={{ letterSpacing: 0.5 }}>
                Departmental Reports
              </Typography>
            </Stack>
            <Select
              size="small"
              value={filterDept}
              onChange={(e) => setFilterDept(e.target.value)}
              sx={{ minWidth: 120, fontWeight: 600, fontSize: 16, borderRadius: 2 }}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
          </Stack>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }} align="right">Allocated</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }} align="right">Utilized</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }} align="right">Balance</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }} align="right">Bills</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }} align="center">Export</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {reports.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No department reports found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  reports.map((dept, idx) => (
                    <TableRow key={dept._id || dept.name} hover sx={{ bgcolor: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'white' }}>
                      <TableCell sx={{ fontWeight: 600, fontSize: 15 }}>{dept.name}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 15 }}>₹{dept.allocated.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 15 }}>₹{dept.utilized.toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 800, color: (dept.allocated - dept.utilized) < 0 ? 'error.main' : 'success.main', fontSize: 15 }}>₹{(dept.allocated - dept.utilized).toLocaleString()}</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600, fontSize: 15 }}>{dept.transactions?.length || 0}</TableCell>
                      <TableCell align="center">
                        <Button
                          variant="outlined"
                          size="small"
                          startIcon={<Download />}
                          onClick={() => downloadProtectedPDF(
                            `${BASE}/departments/report/${dept._id}/pdf?filter=${filterDept}`,
                            `${dept.name}_Report_${filterDept}.pdf`
                          )}
                          sx={{ minWidth: 90, fontWeight: 700, borderRadius: 2 }}
                        >
                          PDF
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* Remove All Transactions Table and Filters from here */}

      {/* Charts Section (smaller, at the bottom, side by side) */}
      <Grid container spacing={3} mb={2}>
        {/* Department Chart Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3, borderRadius: 4, boxShadow: '0 6px 24px rgba(25, 118, 210, 0.08)', background: '#f8faff' }}>
            <CardContent>
              {/* Department Chart Filters */}
              <Stack direction="row" spacing={2} mb={2} sx={{ fontFamily: 'inherit' }}>
                <FormControl sx={{ minWidth: 180 }}>
                  <InputLabel>Chart Department</InputLabel>
                  <Select
                    value={deptChartFilters.department}
                    onChange={e => setDeptChartFilters({ ...deptChartFilters, department: e.target.value })}
                    label="Chart Department"
                    sx={{ fontWeight: 600, fontSize: 16, borderRadius: 2 }}
                  >
                    <MenuItem value="">All Departments</MenuItem>
                    {departments.map(d => (
                      <MenuItem key={d._id} value={d._id} sx={{ fontWeight: 600, fontSize: 16 }}>{d.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField label="Semester" value={deptChartFilters.semester} onChange={e => setDeptChartFilters({ ...deptChartFilters, semester: e.target.value })} select sx={{ minWidth: 100 }}>
                  <MenuItem value="">All</MenuItem>
                  {[...Array(8)].map((_, i) => (
                    <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Date" type="date" value={deptChartFilters.date} onChange={e => setDeptChartFilters({ ...deptChartFilters, date: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ minWidth: 120 }} />
                <TextField label="Month" type="month" value={deptChartFilters.month} onChange={e => setDeptChartFilters({ ...deptChartFilters, month: e.target.value })} sx={{ minWidth: 120 }} />
                <TextField label="Year" type="number" value={deptChartFilters.year} onChange={e => setDeptChartFilters({ ...deptChartFilters, year: e.target.value })} placeholder="e.g. 2024" sx={{ minWidth: 100 }} />
              </Stack>
              <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ letterSpacing: 0.5 }}>
                {chartDepartment ? `Department: ${selectedDept?.name}` : 'Overall Financial Distribution'}
              </Typography>
              <Box sx={{ width: '100%', maxWidth: 320, mx: 'auto', mb: 2 }}>
                {deptChartData
                  ? <Doughnut data={deptChartData} options={{ responsive: true, plugins: { legend: { position: 'bottom' } } }} />
                  : <Typography align="center" color="text.secondary" fontSize={14}>No data for this department and filters.</Typography>
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
        {/* Overall Summary Chart Section */}
        <Grid item xs={12} md={6}>
          <Card sx={{ mb: 3, borderRadius: 4, boxShadow: '0 6px 24px rgba(25, 118, 210, 0.08)', background: '#f8faff' }}>
            <CardContent>
              {/* Overall Chart Filters */}
              <Stack direction="row" spacing={2} mb={2} sx={{ fontFamily: 'inherit' }}>
                <TextField label="Semester" value={overallChartFilters.semester} onChange={e => setOverallChartFilters({ ...overallChartFilters, semester: e.target.value })} select sx={{ minWidth: 100 }}>
                  <MenuItem value="">All</MenuItem>
                  {[...Array(8)].map((_, i) => (
                    <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                  ))}
                </TextField>
                <TextField label="Date" type="date" value={overallChartFilters.date} onChange={e => setOverallChartFilters({ ...overallChartFilters, date: e.target.value })} InputLabelProps={{ shrink: true }} sx={{ minWidth: 120 }} />
                <TextField label="Month" type="month" value={overallChartFilters.month} onChange={e => setOverallChartFilters({ ...overallChartFilters, month: e.target.value })} sx={{ minWidth: 120 }} />
                <TextField label="Year" type="number" value={overallChartFilters.year} onChange={e => setOverallChartFilters({ ...overallChartFilters, year: e.target.value })} placeholder="e.g. 2024" sx={{ minWidth: 100 }} />
              </Stack>
              <Typography variant="subtitle1" fontWeight={700} mb={2} sx={{ letterSpacing: 0.5 }}>
                Overall Financial Summary
              </Typography>
              <Box sx={{ width: '100%', maxWidth: 340, mx: 'auto', mb: 2, height: 260 }}>
                {overallChartData
                  ? <Bar data={overallChartData} options={chartOptions} />
                  : <Typography align="center" color="text.secondary" fontSize={14}>No data</Typography>
                }
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </AdminLayout>
  );
};

export default Reports;