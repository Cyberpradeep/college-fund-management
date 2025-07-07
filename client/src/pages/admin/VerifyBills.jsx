import { useEffect, useState } from 'react';
import API from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Button, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, Paper, Typography, Stack, Chip,
  IconButton, TextField
} from '@mui/material';
import { Check, Close, Download } from '@mui/icons-material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import dayjs from 'dayjs';

const VerifyBills = () => {
  const [bills, setBills] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [filterDate, setFilterDate] = useState(null);
  const [filterMonth, setFilterMonth] = useState('');

  const fetchBills = async () => {
    try {
      const { data } = await API.get('/transactions');
      setBills(data);
      setFiltered(data);
    } catch (err) {
      console.error('Failed to fetch bills', err);
    }
  };

  const updateStatus = async (id, status) => {
    try {
      await API.put(`/transactions/verify/${id}`, { status });
      setBills(prev => prev.map(b => b._id === id ? { ...b, status } : b));
      filterBills();
    } catch (err) {
      console.error('Status update failed', err);
    }
  };

  const download = async (id) => {
    const token = JSON.parse(localStorage.getItem('user'))?.token;
    if (!token) return alert('No auth token found');

    try {
      const res = await fetch(`http://localhost:5000/api/transactions/download/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (!res.ok) throw new Error('Download failed');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement('a');
      a.href = url;
      a.download = `Bill_${id}.pdf`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      alert('Download failed');
      console.error(err);
    }
  };

  const filterBills = () => {
    let result = bills;
    if (filterDate) {
      const d = dayjs(filterDate).format('YYYY-MM-DD');
      result = result.filter(b =>
        dayjs(b.billDate).format('YYYY-MM-DD') === d
      );
    }
    if (filterMonth) {
      result = result.filter(b =>
        dayjs(b.billDate).format('YYYY-MM') === filterMonth
      );
    }
    setFiltered(result);
  };

  useEffect(() => {
    fetchBills();
  }, []);

  useEffect(() => {
    filterBills();
  }, [filterDate, filterMonth]);

  return (
    <AdminLayout>
      <Typography variant="h5" fontWeight={600} mb={3}>
        Verify Bills
      </Typography>

      <Stack direction="row" spacing={2} mb={2}>
        <DatePicker
          label="Filter by Date"
          value={filterDate}
          onChange={(newVal) => setFilterDate(newVal)}
        />
        <TextField
          label="Filter by Month"
          type="month"
          value={filterMonth}
          onChange={e => setFilterMonth(e.target.value)}
        />
        <Button onClick={() => {
          setFilterDate(null);
          setFilterMonth('');
          setFiltered(bills);
        }}>
          Reset Filters
        </Button>
      </Stack>

      <Paper sx={{ overflow: 'hidden' }}>
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Department</TableCell>
                <TableCell>Bill No</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtered.map((bill) => (
                <TableRow key={bill._id} hover>
                  <TableCell>{bill.department?.name}</TableCell>
                  <TableCell>{bill.billNo}</TableCell>
                  <TableCell>{bill.purpose}</TableCell>
                  <TableCell>₹{bill.amount}</TableCell>
                  <TableCell>
                    {dayjs(bill.billDate).format('YYYY-MM-DD HH:mm')}
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={bill.status}
                      size="small"
                      color={
                        bill.status === 'verified' ? 'success' :
                        bill.status === 'rejected' ? 'error' : 'default'
                      }
                    />
                  </TableCell>
                  <TableCell align="right">
                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                      {bill.status === 'pending' ? (
                        <>
                          <IconButton onClick={() => updateStatus(bill._id, 'verified')} color="success">
                            <Check />
                          </IconButton>
                          <IconButton onClick={() => updateStatus(bill._id, 'rejected')} color="error">
                            <Close />
                          </IconButton>
                        </>
                      ) : (
                        <Typography variant="caption" sx={{ fontStyle: 'italic', pt: 1 }}>
                          Already {bill.status}
                        </Typography>
                      )}
                      <IconButton onClick={() => download(bill._id)} color="primary">
                        <Download />
                      </IconButton>
                    </Stack>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </AdminLayout>
  );
};

export default VerifyBills;
