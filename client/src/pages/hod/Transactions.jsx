import { useEffect, useState } from 'react';
import API from '../../services/api';
import HODLayout from '../../layouts/HODLayout';
import {
  Typography,
  Card,
  CardContent,
  Grid,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Stack,
  TextField,
  IconButton,
  Select,
  MenuItem,
  Box
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Download, Refresh } from '@mui/icons-material';
import dayjs from 'dayjs';

const Transactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [allocatedFund, setAllocatedFund] = useState(0);
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const [loading, setLoading] = useState(true);

  const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = '/reports/hod';
      const params = [];
      if (date) params.push(`date=${date}`);
      if (month) params.push(`month=${month}`);
      if (year) params.push(`year=${year}`);
      if (semester) params.push(`semester=${semester}`);
      if (params.length) url += '?' + params.join('&');
      const { data } = await API.get(url);
      // Handle different possible response structures for backward compatibility
      const allocated = data.allocated || data.allocatedFund || data.allocatedFunds || 0;
      setAllocatedFund(allocated);
      setTransactions(data.transactions || []);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactions([]);
      setAllocatedFund(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
  }, [date, month, year, semester]);

  const downloadSingleBill = async (id) => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await fetch(`${BASE}/transactions/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Download error:', err.message);
      alert('Download failed');
    }
  };

  // Download HOD PDF using new backend endpoint
  const downloadPDF = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      let url = `${BASE}/reports/hod/export`;
      const params = [];
      if (date) params.push(`date=${date}`);
      if (month) params.push(`month=${month}`);
      if (year) params.push(`year=${year}`);
      if (semester) params.push(`semester=${semester}`);
      if (params.length) url += '?' + params.join('&');
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const urlBlob = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = urlBlob;
      a.download = `hod_transactions_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Report download failed:', err.message);
      alert('Report download failed');
    }
  };

  const handleResetFilters = () => {
    setDate('');
    setMonth('');
    setYear('');
    setSemester('');
  };

  return (
    <HODLayout>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Download sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
          Department Transactions
        </Typography>
        <Box flex={1} />
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={downloadPDF}
          sx={{ bgcolor: 'primary.dark', '&:hover': { bgcolor: 'primary.main' } }}
        >
          Download PDF
        </Button>
      </Stack>

      <Card sx={{ mb: 4, p: 3, boxShadow: '0 4px 16px rgba(25, 118, 210, 0.06)', borderRadius: 3, background: '#fcfcfc' }}>
        <Typography variant="subtitle1" mb={2} fontWeight={700} color="primary.main">
          Admin Allocated Fund: ₹{allocatedFund.toLocaleString('en-IN')}
        </Typography>
        <Typography variant="h6" mb={2}>Filter Transactions</Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <DatePicker
              label="Filter by Date"
              value={date ? dayjs(date) : null}
              onChange={(newValue) => setDate(newValue ? dayjs(newValue).format('YYYY-MM-DD') : '')}
              renderInput={(params) => <TextField {...params} fullWidth />}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Select
              fullWidth
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Select Month' }}
            >
              <MenuItem value="">All Months</MenuItem>
              <MenuItem value="01">January</MenuItem>
              <MenuItem value="02">February</MenuItem>
              <MenuItem value="03">March</MenuItem>
              <MenuItem value="04">April</MenuItem>
              <MenuItem value="05">May</MenuItem>
              <MenuItem value="06">June</MenuItem>
              <MenuItem value="07">July</MenuItem>
              <MenuItem value="08">August</MenuItem>
              <MenuItem value="09">September</MenuItem>
              <MenuItem value="10">October</MenuItem>
              <MenuItem value="11">November</MenuItem>
              <MenuItem value="12">December</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <TextField
              fullWidth
              label="Filter by Year"
              value={year}
              onChange={(e) => setYear(e.target.value)}
              type="number"
              inputProps={{ min: 2000, max: new Date().getFullYear() }}
            />
          </Grid>
          <Grid item xs={12} sm={6} md={2}>
            <Select
              fullWidth
              value={semester}
              onChange={(e) => setSemester(e.target.value)}
              displayEmpty
              inputProps={{ 'aria-label': 'Select Semester' }}
            >
              <MenuItem value="">All Semesters</MenuItem>
              <MenuItem value="Odd">Odd</MenuItem>
              <MenuItem value="Even">Even</MenuItem>
            </Select>
          </Grid>
          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={<Refresh />}
              onClick={handleResetFilters}
              fullWidth
            >
              Reset
            </Button>
          </Grid>
        </Grid>
      </Card>

      <Card sx={{ boxShadow: '0 4px 16px rgba(25, 118, 210, 0.06)', borderRadius: 3, mt: 2, background: '#fcfcfc' }}>
        <CardContent>
          <Typography variant="h6" mb={2} fontWeight={700} color="primary.main">Transaction History</Typography>
          <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid #e0e0e0', borderRadius: 2, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)' }}>
            <Table sx={{ minWidth: 650 }} aria-label="transactions table">
              <TableHead sx={{ bgcolor: '#f5f5f5' }}>
                <TableRow>
                  <TableCell>Date</TableCell>
                  <TableCell>Bill No</TableCell>
                  <TableCell>Purpose</TableCell>
                  <TableCell>Amount</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Download</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center">Loading transactions...</TableCell>
                  </TableRow>
                ) : (
                  <>
                    {/* Admin Allocated Fund Row */}
                    <TableRow sx={{ bgcolor: '#f8f9fa' }}>
                      <TableCell>Admin Allocation</TableCell>
                      <TableCell>-</TableCell>
                      <TableCell>Fund Allocation by Admin</TableCell>
                      <TableCell sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        ₹{allocatedFund.toLocaleString('en-IN')}
                      </TableCell>
                      <TableCell>Allocated</TableCell>
                      <TableCell>-</TableCell>
                    </TableRow>
                    {/* All Transactions */}
                    {transactions.length > 0 ? (
                      transactions.map((tx) => (
                        <TableRow key={tx._id}>
                          <TableCell>{tx.billDate ? dayjs(tx.billDate).format('YYYY-MM-DD') : '-'}</TableCell>
                          <TableCell>{tx.billNo || '-'}</TableCell>
                          <TableCell>{tx.purpose || '-'}</TableCell>
                          <TableCell>₹{tx.amount?.toLocaleString('en-IN') || 0}</TableCell>
                          <TableCell>{tx.status || '-'}</TableCell>
                          <TableCell>
                            <IconButton onClick={() => downloadSingleBill(tx._id)} color="primary">
                              <Download />
                            </IconButton>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={6} align="center">No transactions found for the selected filters.</TableCell>
                      </TableRow>
                    )}
                  </>
                )}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>
    </HODLayout>
  );
};

export default Transactions;