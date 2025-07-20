import { useParams } from 'react-router-dom';
import { useEffect, useState } from 'react';
import API from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Button,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Select,
  MenuItem,
  Card,
  CardContent,
  Stack,
  Box,
  TextField,
  Grid,
  useTheme,
  Skeleton
} from '@mui/material';
import { Download, AccountBalance, TrendingUp, Person, AttachMoney } from '@mui/icons-material';
import dayjs from 'dayjs';

const DepartmentDetails = () => {
  const { id } = useParams();
  const [deptData, setDeptData] = useState(null);
  const [filter, setFilter] = useState('monthly');
  const [transactions, setTransactions] = useState([]);
  const [semester, setSemester] = useState('');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchData = async () => {
    try {
      const { data } = await API.get(`/departments/report/${id}?filter=${filter}`);
      setDeptData(data);
    } catch (err) {
      console.error('Failed to load department data', err);
    }
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

  const fetchTransactions = async () => {
    let url = `/transactions?department=${id}`;
    const params = [];
    if (semester) params.push(`semester=${semester}`);
    if (date) params.push(`date=${date}`);
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (params.length) url += '&' + params.join('&');
    const { data } = await API.get(url);
    setTransactions(data);
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [filter, id]);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [semester, date, month, year]);

  const downloadPDF = async () => {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    let url = `${BASE}/reports/admin/export?department=${id}`;
    const params = [];
    if (semester) params.push(`semester=${semester}`);
    if (date) params.push(`date=${date}`);
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (params.length) url += '&' + params.join('&');
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    if (!res.ok) return alert('Failed to download PDF');
    const blob = await res.blob();
    const urlObj = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = urlObj;
    a.download = `department_transactions.pdf`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  const theme = useTheme();
  if (!deptData) {
    return (
      <AdminLayout>
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: 300 }}>
          <Skeleton variant="rectangular" width={400} height={200} />
        </Box>
      </AdminLayout>
    );
  }

  const coordinator = deptData?.coordinatorUser;

  return (
    <AdminLayout>
      {/* Header */}
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <AccountBalance sx={{ fontSize: 32, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 1 }}>
          {deptData.department} Department
        </Typography>
      </Stack>

      {/* Summary Cards */}
      <Grid container spacing={3} mb={3}>
        {[{
          title: 'Allocated',
          value: deptData.allocated,
          icon: <AccountBalance sx={{ fontSize: 22 }} />, 
          color: theme.palette.primary.main,
          bg: '#f5f8ff'
        }, {
          title: 'Utilized',
          value: deptData.utilized,
          icon: <TrendingUp sx={{ fontSize: 22 }} />, 
          color: theme.palette.success.main,
          bg: '#f5fcf7'
        }, {
          title: 'Balance',
          value: deptData.balance,
          icon: <AttachMoney sx={{ fontSize: 22 }} />, 
          color: theme.palette.warning.main,
          bg: '#fffaf5'
        }].map((item, i) => (
          <Grid item xs={12} sm={6} md={4} key={i} display="flex" justifyContent="center" alignItems="stretch">
            <Card sx={{
              width: '100%',
              minWidth: 220,
              maxWidth: 400,
              borderRadius: 3,
              boxShadow: '0 2px 16px 0 rgba(25, 118, 210, 0.10), 0 0 16px 2px ' + item.color + '22',
              background: item.bg,
              borderLeft: `4px solid ${item.color}`,
              transition: '0.3s',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              '&:hover': { 
                transform: 'translateY(-3px)', 
                boxShadow: '0 4px 24px 0 ' + item.color + '44, 0 0 24px 4px ' + item.color + '33'
              }
            }}>
              <CardContent sx={{ py: 2.5, px: 2, width: '100%' }}>
                <Stack direction="row" alignItems="center" spacing={1.5} mb={2} sx={{ width: '100%' }}>
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
                <Box textAlign="center">
                  <Typography variant="h6" fontWeight={700} color={item.color} sx={{ letterSpacing: 0.5 }}>
                    ₹{(item.value || 0).toLocaleString('en-IN')}
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Profile Cards Row - HOD left, Coordinator right */}
      <Grid container spacing={3} mb={3} alignItems="stretch">
        {/* HOD Profile Card */}
        <Grid item xs={12} md={6}>
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
            height: '100%'
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
              <Typography><strong>Name:</strong> {deptData.hod?.name || '-'}</Typography>
              <Typography><strong>Email:</strong> {deptData.hod?.email || '-'}</Typography>
            </Box>
          </Card>
        </Grid>
        {/* Coordinator Profile Card */}
        <Grid item xs={12} md={6}>
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
            height: '100%'
          }}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              backgroundColor: theme.palette.success.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <Person sx={{ fontSize: 38, color: 'success.main' }} />
            </Box>
            <Box>
              <Typography variant="subtitle1" fontWeight={700} mb={0.5}>Coordinator Profile</Typography>
              <Typography><strong>Name:</strong> {coordinator?.name || '-'}</Typography>
              <Typography><strong>Email:</strong> {coordinator?.email || '-'}</Typography>
            </Box>
          </Card>
        </Grid>
      </Grid>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 4 }}>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Download />}
          onClick={downloadPDF}
          sx={{
            mr: 2,
            px: 4,
            py: 1.5,
            fontWeight: 700,
            borderRadius: 2,
            fontSize: 15,
            backgroundColor: 'primary.main',
            '&:hover': { backgroundColor: 'primary.dark' }
          }}
        >
          Download PDF
        </Button>
      </Box>

      {/* Transaction Filters */}
      <Stack direction="row" spacing={2} mb={3}>
        <TextField
          label="Semester"
          value={semester}
          onChange={e => setSemester(e.target.value)}
          select
          sx={{ minWidth: 120 }}
        >
          <MenuItem value="">All</MenuItem>
          {[...Array(8)].map((_, i) => (
            <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
          ))}
        </TextField>
        <TextField
          label="Date"
          type="date"
          value={date}
          onChange={e => setDate(e.target.value)}
          InputLabelProps={{ shrink: true }}
        />
        <TextField
          label="Month"
          type="month"
          value={month}
          onChange={e => setMonth(e.target.value)}
        />
        <TextField
          label="Year"
          type="number"
          value={year}
          onChange={e => setYear(e.target.value)}
          placeholder="e.g. 2024"
        />
      </Stack>

      {/* Transaction Table */}
      <Card sx={{ borderRadius: 4, boxShadow: '0 6px 24px rgba(25, 118, 210, 0.08)', background: '#fcfcfc' }}>
        <CardContent sx={{ py: 1.5, px: 2 }}>
          <Stack direction="row" alignItems="center" spacing={1.5} mb={2}>
            <TrendingUp sx={{ color: 'primary.main', fontSize: 24 }} />
            <Typography variant="h6" fontWeight={800} letterSpacing={0.5} fontSize={16}>
              Department Transactions
            </Typography>
          </Stack>
          <TableContainer component={Paper} sx={{ borderRadius: 3, boxShadow: 'none' }}>
            <Table size="small">
              <TableHead sx={{ bgcolor: 'grey.100' }}>
                <TableRow>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Transaction ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Bill No</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Download Bill</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {(deptData.transactions?.length === 0) ? (
                  <TableRow>
                    <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No transactions found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  deptData.transactions.map((tx, idx) => (
                    <TableRow
                      key={tx._id || tx.transactionId || idx}
                      hover
                      sx={{ bgcolor: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'white' }}
                    >
                      <TableCell>{dayjs(tx.billDate).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>
                        {/* Debug: {JSON.stringify(tx)} */}
                        {tx.transactionId
                          || ((tx.purpose && tx.purpose.toLowerCase().includes('allocated'))
                                ? `ALLOC-${(tx._id || '').slice(-4)}-${tx.billDate ? new Date(tx.billDate).getTime() : ''}`
                                : '-')}
                      </TableCell>
                      <TableCell>{tx.billNo || '-'}</TableCell>
                      <TableCell>{tx.purpose}</TableCell>
                      <TableCell>₹{tx.amount?.toLocaleString()}</TableCell>
                      <TableCell>{tx.status}</TableCell>
                      <TableCell>
                        <Button
                          size="small"
                          startIcon={<Download />}
                          onClick={() => handleDownloadBill(tx._id)}
                          sx={{ fontWeight: 600, borderRadius: 2 }}
                          disabled={tx.status === 'allocated'}
                        >
                          Bill
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
    </AdminLayout>
  );
};

export default DepartmentDetails;
