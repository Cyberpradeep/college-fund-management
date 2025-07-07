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
  Select,
  MenuItem,
  Button,
  Stack,
  TextField,
  IconButton
} from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { Download, Refresh, FilterAlt } from '@mui/icons-material';
import dayjs from 'dayjs';

const Transactions = () => {
  const [filterTable, setFilterTable] = useState('monthly');
  const [tableReport, setTableReport] = useState({});
  const [filterDate, setFilterDate] = useState(null);

  const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

  
const fetchTableData = async () => {
    const { data } = await API.get(`/reports/hod?filter=${filterTable}`);
    setTableReport(data);
  };
  useEffect(() => {
    fetchTableData();
  }, [filterTable]);

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

  const downloadFullReport = async () => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const res = await fetch(`${BASE}/departments/hod/report/pdf`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to download');
      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `department_report.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch (err) {
      console.error('Report download failed:', err.message);
      alert('Report download failed');
    }
  };

  const handleResetFilters = () => {
    setFilterTable('monthly');
    setFilterDate(null);
  };

  const filteredTransactions = filterDate
    ? tableReport.transactions?.filter(tx =>
        dayjs(tx.billDate).format('YYYY-MM-DD') === dayjs(filterDate).format('YYYY-MM-DD')
      )
    : tableReport.transactions || [];

  return (
    <HODLayout>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h5" fontWeight={600}>Department Financial Transactions</Typography>
        <Button
          variant="contained"
          startIcon={<Download />}
          onClick={downloadFullReport}
          sx={{ 
            bgcolor: 'primary.dark',
            '&:hover': { bgcolor: 'primary.main' }
          }}
        >
          Download Full Report
        </Button>
      </Stack>

      {/* Enhanced Summary Cards */}
      <Grid container spacing={3} mb={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderLeft: '4px solid #1976d2',
            boxShadow: '0 4px 12px rgba(25, 118, 210, 0.2)',
            borderRadius: '8px',
            height: '100%'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <div style={{
                  width: 24,
                  height: 24,
                  backgroundColor: '#e3f2fd',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" color="primary" fontWeight={600}>A</Typography>
                </div>
                <Typography variant="subtitle2" color="text.secondary">ALLOCATED FUNDS</Typography>
              </Stack>
              <Typography variant="h5" color="primary" fontWeight={700}>
                ₹{tableReport.allocated?.toLocaleString() || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderLeft: '4px solid #2e7d32',
            boxShadow: '0 4px 12px rgba(46, 125, 50, 0.2)',
            borderRadius: '8px',
            height: '100%'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <div style={{
                  width: 24,
                  height: 24,
                  backgroundColor: '#e8f5e9',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" color="success" fontWeight={600}>U</Typography>
                </div>
                <Typography variant="subtitle2" color="text.secondary">UTILIZED FUNDS</Typography>
              </Stack>
              <Typography variant="h5" color="success.dark" fontWeight={700}>
                ₹{tableReport.utilized?.toLocaleString() || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            borderLeft: '4px solid #ed6c02',
            boxShadow: '0 4px 12px rgba(237, 108, 2, 0.2)',
            borderRadius: '8px',
            height: '100%'
          }}>
            <CardContent>
              <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                <div style={{
                  width: 24,
                  height: 24,
                  backgroundColor: '#fff3e0',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  <Typography variant="body2" color="warning" fontWeight={600}>B</Typography>
                </div>
                <Typography variant="subtitle2" color="text.secondary">AVAILABLE BALANCE</Typography>
              </Stack>
              <Typography variant="h5" color="warning.dark" fontWeight={700}>
                ₹{tableReport.balance?.toLocaleString() || '0'}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Table + Filter Section */}
      <Card variant="outlined" sx={{ borderRadius: 2, mb: 3 }}>
        <Stack 
          direction="row" 
          justifyContent="space-between" 
          alignItems="center" 
          p={2}
          sx={{ 
            bgcolor: 'background.paper', 
            borderBottom: '1px solid',
            borderColor: 'divider',
            borderRadius: '8px 8px 0 0'
          }}
        >
          <Stack direction="row" alignItems="center" spacing={1}>
            <FilterAlt color="primary" />
            <Typography variant="h6">Transaction History</Typography>
            <Typography variant="subtitle2" color="text.secondary" sx={{ ml: 1 }}>
              ({filterTable})
            </Typography>
          </Stack>
          
          <Stack direction="row" spacing={2} alignItems="center">
            <DatePicker
              label="Filter by Date"
              value={filterDate}
              onChange={(newVal) => setFilterDate(newVal)}
              slotProps={{ 
                textField: { 
                  size: 'small', 
                  variant: 'outlined' 
                } 
              }}
              sx={{ width: 180 }}
            />
            
            <Select
              size="small"
              value={filterTable}
              onChange={(e) => setFilterTable(e.target.value)}
              variant="outlined"
              sx={{ width: 120 }}
            >
              <MenuItem value="weekly">Weekly</MenuItem>
              <MenuItem value="monthly">Monthly</MenuItem>
              <MenuItem value="yearly">Yearly</MenuItem>
            </Select>
            
            <Button
              variant="outlined"
              size="small"
              startIcon={<Refresh />}
              onClick={handleResetFilters}
              sx={{ 
                borderColor: 'grey.300',
                color: 'text.secondary',
                '&:hover': {
                  borderColor: 'primary.main',
                  color: 'primary.main'
                }
              }}
            >
              Reset
            </Button>
          </Stack>
        </Stack>

        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead sx={{ bgcolor: 'background.default' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 600 }}>Bill No</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Purpose</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="right">Amount (₹)</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Date</TableCell>
                <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 600 }} align="center">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <TableRow key={tx._id} hover>
                    <TableCell>{tx.billNo}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{tx.purpose}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      ₹{tx.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{tx.billDate?.slice(0, 10)}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          display: 'inline-block',
                          px: 1,
                          py: 0.5,
                          borderRadius: 1,
                         bgcolor: tx.status === 'verified' ? 'success.light' :
         tx.status === 'pending' ? 'warning.light' :
         tx.status === 'allocated' ? 'info.light' :
         'error.light',
color: tx.status === 'verified' ? 'success.dark' :
       tx.status === 'pending' ? 'warning.dark' :
       tx.status === 'allocated' ? 'info.dark' :
       'error.dark'

                        }}
                      >
                        {tx.status.charAt(0).toUpperCase() + tx.status.slice(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
  {tx.status !== 'allocated' && (
    <IconButton
      size="small"
      onClick={() => downloadSingleBill(tx._id)}
      color="primary"
      sx={{ 
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 1,
        '&:hover': {
          bgcolor: 'primary.light'
        }
      }}
    >
      <Download fontSize="small" />
    </IconButton>
  )}
</TableCell>

                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                    <Typography variant="body1" color="text.secondary">
                      No transactions found for selected filters
                    </Typography>
                    {filterDate && (
                      <Button 
                        variant="text" 
                        size="small" 
                        onClick={handleResetFilters}
                        sx={{ mt: 1 }}
                      >
                        Clear filters
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Card>

      {filteredTransactions.length > 0 && (
        <Typography variant="body2" color="text.secondary" align="right">
          Showing {filteredTransactions.length} of {tableReport.transactions?.length || 0} transactions
        </Typography>
      )}
    </HODLayout>
  );
};

export default Transactions;