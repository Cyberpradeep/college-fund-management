import React, { useEffect, useState } from 'react';
import CoordinatorSidebar from '../../components/CoordinatorSidebar';
import API from '../../services/api';
import {
  Box, Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Chip, Stack, TextField, Button, CircularProgress, MenuItem
} from '@mui/material';
import dayjs from 'dayjs';
import CoordinatorLayout from '../../layouts/CoordinatorLayout';

const semesters = ['Odd', 'Even']; // Example, adjust as needed

const CoordinatorTransactions = () => {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ semester: '', date: '', month: '', year: '' });

  const fetchTransactions = async () => {
    setLoading(true);
    try {
      let url = '/transactions/my';
      const params = [];
      if (filters.semester) params.push(`semester=${filters.semester}`);
      if (filters.date) params.push(`date=${filters.date}`);
      if (filters.month) params.push(`month=${filters.month}`);
      if (filters.year) params.push(`year=${filters.year}`);
      if (params.length) url += '?' + params.join('&');
      const { data } = await API.get(url);
      setTransactions(data);
    } catch (err) {
      setTransactions([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTransactions();
    // eslint-disable-next-line
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const clearFilters = () => {
    setFilters({ semester: '', date: '', month: '', year: '' });
  };

  const statusColor = (status) => {
    if (status === 'verified') return 'success';
    if (status === 'pending') return 'warning';
    if (status === 'rejected') return 'error';
    return 'default';
  };

  return (
    <CoordinatorLayout>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        My Uploaded Bills
      </Typography>
      <Paper sx={{ p: 2, mb: 3 }}>
        <Stack direction="row" spacing={2} alignItems="center">
          <TextField
            select
            label="Semester"
            name="semester"
            value={filters.semester}
            onChange={handleFilterChange}
            sx={{ minWidth: 120 }}
          >
            <MenuItem value="">All</MenuItem>
            {semesters.map(s => <MenuItem key={s} value={s}>{s}</MenuItem>)}
          </TextField>
          <TextField
            label="Date"
            name="date"
            type="date"
            value={filters.date}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Month (YYYY-MM)"
            name="month"
            type="month"
            value={filters.month}
            onChange={handleFilterChange}
            InputLabelProps={{ shrink: true }}
          />
          <TextField
            label="Year"
            name="year"
            type="number"
            value={filters.year}
            onChange={handleFilterChange}
            sx={{ minWidth: 100 }}
          />
          <Button variant="outlined" color="secondary" onClick={clearFilters}>Clear</Button>
        </Stack>
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress size={60} /></Box>
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Date</TableCell>
                <TableCell>Bill No</TableCell>
                <TableCell>Purpose</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Status</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transactions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} align="center">No bills found.</TableCell>
                </TableRow>
              ) : transactions.map((tx) => (
                <TableRow key={tx._id}>
                  <TableCell>{tx.billDate ? dayjs(tx.billDate).format('YYYY-MM-DD') : '-'}</TableCell>
                  <TableCell>{tx.billNo || '-'}</TableCell>
                  <TableCell>{tx.purpose || '-'}</TableCell>
                  <TableCell>₹{tx.amount?.toLocaleString() || 0}</TableCell>
                  <TableCell>
                    <Chip label={tx.status} color={statusColor(tx.status)} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </CoordinatorLayout>
  );
};

export default CoordinatorTransactions; 