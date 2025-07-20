import React, { useEffect, useState } from 'react';
import HODLayout from '../../layouts/HODLayout';
import API from '../../services/api';
import { Box, Typography, Paper, Stack, TextField, MenuItem, CircularProgress, Grid } from '@mui/material';
import { Bar, Doughnut } from 'react-chartjs-2';
import dayjs from 'dayjs';

const semesters = ['Odd', 'Even'];

const FundCharts = () => {
  const [filters, setFilters] = useState({ semester: '', date: '', month: '', year: '' });
  const [loading, setLoading] = useState(true);
  const [fundData, setFundData] = useState({ allocated: 0, utilized: 0, balance: 0, transactions: [] });

  const fetchData = async () => {
    setLoading(true);
    try {
      let url = '/reports/hod';
      const params = [];
      if (filters.semester) params.push(`semester=${filters.semester}`);
      if (filters.date) params.push(`date=${filters.date}`);
      if (filters.month) params.push(`month=${filters.month}`);
      if (filters.year) params.push(`year=${filters.year}`);
      if (params.length) url += '?' + params.join('&');
      const { data } = await API.get(url);
      setFundData({
        allocated: data.allocated || 0,
        utilized: data.utilized || 0,
        balance: (data.allocated || 0) - (data.utilized || 0),
        transactions: data.transactions || []
      });
    } catch (err) {
      setFundData({ allocated: 0, utilized: 0, balance: 0, transactions: [] });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [filters]);

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // Chart data
  const barData = {
    labels: ['Allocated', 'Utilized', 'Balance'],
    datasets: [
      {
        label: 'Amount (₹)',
        data: [fundData.allocated, fundData.utilized, fundData.balance],
        backgroundColor: ['#1976d2', '#43a047', '#ffa000'],
      },
    ],
  };

  const doughnutData = {
    labels: ['Utilized', 'Balance'],
    datasets: [
      {
        data: [fundData.utilized, fundData.balance],
        backgroundColor: ['#43a047', '#ffa000'],
      },
    ],
  };

  return (
    <HODLayout>
      <Typography variant="h4" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
        Fund Usage Charts
      </Typography>
      <Paper sx={{ p: 3, mb: 4 }}>
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
        </Stack>
      </Paper>
      {loading ? (
        <Box display="flex" justifyContent="center" mt={4}><CircularProgress size={60} /></Box>
      ) : (
        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>Fund Overview</Typography>
              <Bar data={barData} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </Paper>
          </Grid>
          <Grid item xs={12} md={6}>
            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" mb={2}>Utilization Breakdown</Typography>
              <Doughnut data={doughnutData} options={{ responsive: true }} />
            </Paper>
          </Grid>
        </Grid>
      )}
    </HODLayout>
  );
};

export default FundCharts; 