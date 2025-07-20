import { useEffect, useState } from 'react';
import API from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Typography, Table, TableBody, TableCell, TableHead, TableRow, Paper, Button, Stack, TextField, MenuItem, Select, InputLabel, FormControl, Card, CardContent, Box
} from '@mui/material';
import { Download } from '@mui/icons-material';
import dayjs from 'dayjs';

const AdminTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [department, setDepartment] = useState('');
  const [date, setDate] = useState('');
  const [month, setMonth] = useState('');
  const [year, setYear] = useState('');
  const [semester, setSemester] = useState('');
  const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  const fetchDepartments = async () => {
    const { data } = await API.get('/departments');
    setDepartments(data);
  };

  const fetchTransactions = async () => {
    // Fetch transactions
    let url = '/transactions';
    const params = [];
    if (department) params.push(`department=${department}`);
    if (date) params.push(`date=${date}`);
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (semester) params.push(`semester=${semester}`);
    if (params.length) url += '?' + params.join('&');
    const { data: txData } = await API.get(url);
    // Fetch allocations
    const { data: deptData } = await API.get('/departments');
    let allocationRows = [];
    deptData.forEach(dept => {
      if (!dept.fundAllocations) return;
      dept.fundAllocations.forEach(alloc => {
        // Apply filters
        if (department && dept._id !== department) return;
        if (semester && String(alloc.semester) !== String(semester)) return;
        if (year && String(alloc.year) !== String(year)) return;
        if (date && alloc.startDate && alloc.startDate.slice(0,10) !== date) return;
        if (month && alloc.startDate && alloc.startDate.slice(0,7) !== month) return;
        allocationRows.push({
          _id: `ALLOC-${dept._id.slice(-4)}-${alloc.startDate ? new Date(alloc.startDate).getTime() : Date.now()}`,
          date: alloc.startDate ? alloc.startDate.slice(0,10) : '-',
          transactionId: `ALLOC-${dept._id.slice(-4)}-${alloc.startDate ? new Date(alloc.startDate).getTime() : Date.now()}`,
          department: dept.name,
          billNo: 'N/A',
          purpose: 'Fund allocated by Admin',
          status: 'allocated',
          amount: alloc.amount
        });
      });
    });
    // Map transactions to unified format
    let transactionRows = txData.map(tx => ({
      _id: tx._id,
      date: tx.billDate ? dayjs(tx.billDate).format('YYYY-MM-DD') : '-',
      transactionId: tx.transactionId || '-',
      department: tx.department?.name || '-',
      billNo: tx.billNo || '-',
      purpose: tx.purpose || '-',
      status: tx.status,
      amount: tx.amount || 0,
      isAllocation: false
    }));
    // Merge and sort
    let allRows = [...allocationRows, ...transactionRows];
    allRows.sort((a, b) => new Date(b.date) - new Date(a.date));
    setTransactions(allRows);
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [department, date, month, year, semester]);

  const downloadPDF = async () => {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    let url = `${BASE}/reports/admin/export`;
    const params = [];
    if (department) params.push(`department=${department}`);
    if (date) params.push(`date=${date}`);
    if (month) params.push(`month=${month}`);
    if (year) params.push(`year=${year}`);
    if (semester) params.push(`semester=${semester}`);
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

  const handleDownloadBill = async (txId, isAllocation) => {
    if (isAllocation) return;
    
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

  return (
    <AdminLayout>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={4}>
        <Typography variant="h5" fontWeight={800} color="primary" sx={{ letterSpacing: 1 }}>
          All Transactions
        </Typography>
        <Button variant="contained" startIcon={<Download />} onClick={downloadPDF} sx={{ fontWeight: 700, fontSize: 16, borderRadius: 2, px: 4, py: 1.5, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.10)' }}>
          Export PDF
        </Button>
      </Stack>
      <Card sx={{ borderRadius: 4, boxShadow: '0 6px 24px rgba(25, 118, 210, 0.08)', background: '#fcfcfc', mb: 5 }}>
        <CardContent>
          <Stack direction="row" spacing={2} mb={3}>
            <FormControl sx={{ minWidth: 180 }}>
              <InputLabel>Department</InputLabel>
              <Select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                label="Department"
                sx={{ fontWeight: 600, fontSize: 16, borderRadius: 2 }}
              >
                <MenuItem value="">All</MenuItem>
                {departments.map(d => (
                  <MenuItem key={d._id} value={d._id} sx={{ fontWeight: 600, fontSize: 16 }}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Semester"
              value={semester}
              onChange={e => setSemester(e.target.value)}
              select
              sx={{ minWidth: 120, fontWeight: 600, fontSize: 16, borderRadius: 2 }}
            >
              <MenuItem value="">All</MenuItem>
              {[...Array(8)].map((_, i) => (
                <MenuItem key={i+1} value={i+1} sx={{ fontWeight: 600, fontSize: 16 }}>{i+1}</MenuItem>
              ))}
            </TextField>
            <TextField
              label="Date"
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              InputLabelProps={{ shrink: true }}
              sx={{ fontWeight: 600, fontSize: 16, borderRadius: 2 }}
            />
            <TextField
              label="Month"
              type="month"
              value={month}
              onChange={e => setMonth(e.target.value)}
              sx={{ fontWeight: 600, fontSize: 16, borderRadius: 2 }}
            />
            <TextField
              label="Year"
              type="number"
              value={year}
              onChange={e => setYear(e.target.value)}
              placeholder="e.g. 2024"
              sx={{ fontWeight: 600, fontSize: 16, borderRadius: 2 }}
            />
          </Stack>
          <Box sx={{ borderRadius: 3, overflow: 'hidden', boxShadow: '0 1px 4px rgba(25, 118, 210, 0.04)' }}>
            <Table size="small">
              <TableHead>
                <TableRow sx={{ bgcolor: 'background.default' }}>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Date</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Transaction ID</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Department</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Bill No</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Purpose</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Status</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Amount</TableCell>
                  <TableCell sx={{ fontWeight: 700, fontSize: 16 }}>Download Bill</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {transactions.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography variant="body1" color="text.secondary">
                        No transactions found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  transactions.map((tx, idx) => (
                    <TableRow key={tx._id} hover sx={{ bgcolor: idx % 2 === 0 ? 'rgba(0,0,0,0.02)' : 'white' }}>
                      <TableCell>{tx.date}</TableCell>
                      <TableCell>{tx.transactionId}</TableCell>
                      <TableCell>{tx.department}</TableCell>
                      <TableCell>{tx.billNo}</TableCell>
                      <TableCell>{tx.purpose}</TableCell>
                      <TableCell>{tx.status}</TableCell>
                      <TableCell>₹{tx.amount?.toLocaleString()}</TableCell>
                      <TableCell>
                        {tx.status === 'allocated' ? (
                          <span style={{ color: '#888' }}>N/A</span>
                        ) : (
                          <Button
                            size="small"
                            startIcon={<Download />}
                            onClick={() => handleDownloadBill(tx._id, tx.status === 'allocated')}
                            sx={{ fontWeight: 600, borderRadius: 2 }}
                          >
                            Bill
                          </Button>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </Box>
        </CardContent>
      </Card>
    </AdminLayout>
  );
};

export default AdminTransactions; 