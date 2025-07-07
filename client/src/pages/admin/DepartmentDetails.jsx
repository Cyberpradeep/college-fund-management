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
  Box
} from '@mui/material';
import { Download } from '@mui/icons-material';

const DepartmentDetails = () => {
  const { id } = useParams();
  const [deptData, setDeptData] = useState(null);
  const [filter, setFilter] = useState('monthly');

  const fetchData = async () => {
    try {
      const { data } = await API.get(`/departments/report/${id}?filter=${filter}`);
      setDeptData(data);
    } catch (err) {
      console.error('Failed to load department data', err);
    }
  };

  const handleDownloadBill = (txId) => {
    window.open(`${import.meta.env.VITE_API_BASE_URL}/transactions/download/${txId}`, '_blank');
  };

  useEffect(() => {
    fetchData();
  }, [filter, id]);

  if (!deptData) {
    return (
      <AdminLayout>
        <Typography>Loading department data...</Typography>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <Typography variant="h5" gutterBottom>
        {deptData.department}
      </Typography>

      {/* Summary Cards */}
      <Stack direction="row" spacing={2} sx={{ mb: 4 }}>
        <Card sx={{ flex: 1 }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">Allocated</Typography>
            <Typography variant="h6" color="primary">₹{deptData.allocated.toLocaleString()}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: 'success.light' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">Utilized</Typography>
            <Typography variant="h6" color="success.dark">₹{deptData.utilized.toLocaleString()}</Typography>
          </CardContent>
        </Card>
        <Card sx={{ flex: 1, bgcolor: 'warning.light' }}>
          <CardContent>
            <Typography variant="subtitle2" color="text.secondary">Balance</Typography>
            <Typography variant="h6" color="warning.dark">₹{deptData.balance.toLocaleString()}</Typography>
          </CardContent>
        </Card>
      </Stack>

      {/* HOD Info */}
      <Typography variant="body1" sx={{ mb: 3 }}>
        <strong>HOD:</strong> {deptData.hod?.name || 'Not Assigned'} • {deptData.hod?.email || 'N/A'}
      </Typography>

      {/* Actions */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Button
          variant="contained"
          color="secondary"
          startIcon={<Download />}
          onClick={() => window.open(`${import.meta.env.VITE_API_BASE_URL}/departments/report/${id}/pdf`, '_blank')}
        >
          Export Full Report
        </Button>

        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          size="small"
          sx={{ minWidth: 140 }}
        >
          <MenuItem value="weekly">This Week</MenuItem>
          <MenuItem value="monthly">This Month</MenuItem>
          <MenuItem value="yearly">This Year</MenuItem>
        </Select>
      </Box>

      {/* Table */}
      <Typography variant="h6" gutterBottom>Uploaded Bills</Typography>
      <TableContainer component={Paper}>
        <Table size="small">
          <TableHead sx={{ bgcolor: 'grey.100' }}>
            <TableRow>
              <TableCell><strong>Bill No</strong></TableCell>
              <TableCell><strong>Purpose</strong></TableCell>
              <TableCell><strong>Amount</strong></TableCell>
              <TableCell><strong>Status</strong></TableCell>
              <TableCell><strong>Date</strong></TableCell>
              <TableCell><strong>Download</strong></TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {deptData.transactions.map((tx) => (
              <TableRow key={tx._id} hover>
                <TableCell>{tx.billNo}</TableCell>
                <TableCell>{tx.purpose}</TableCell>
                <TableCell>₹{tx.amount.toLocaleString()}</TableCell>
                <TableCell>{tx.status}</TableCell>
                <TableCell>{tx.billDate?.slice(0, 10)}</TableCell>
                <TableCell>
                  <Button
                    size="small"
                    startIcon={<Download />}
                    onClick={() => handleDownloadBill(tx._id)}
                  >
                    Bill
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </AdminLayout>
  );
};

export default DepartmentDetails;
