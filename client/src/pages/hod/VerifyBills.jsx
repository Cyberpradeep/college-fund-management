import React, { useEffect, useState } from 'react';
import HODLayout from '../../layouts/HODLayout';
import API from '../../services/api';
import {
  Typography, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, Paper, Button, Stack, CircularProgress, IconButton, Card
} from '@mui/material';
import { Download } from '@mui/icons-material';
import dayjs from 'dayjs';

const VerifyBills = () => {
  const [bills, setBills] = useState([]);
  const [loading, setLoading] = useState(true);
  const [verifiedBills, setVerifiedBills] = useState([]);
  const [rejectedBills, setRejectedBills] = useState([]);
  const [filterStatus, setFilterStatus] = useState('verified');

  const fetchBills = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/transactions/my');
      // Only show pending bills uploaded by the coordinator
      const pending = data.filter(tx => tx.status === 'pending');
      setBills(pending);
      // Show verified bills
      const verified = data.filter(tx => tx.status === 'verified');
      setVerifiedBills(verified);
      // Show rejected bills
      const rejected = data.filter(tx => tx.status === 'rejected');
      setRejectedBills(rejected);
    } catch (err) {
      setBills([]);
      setVerifiedBills([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBills();
  }, []);

  const handleVerify = async (id, status) => {
    try {
      await API.put(`/transactions/verify/${id}`, { status });
      fetchBills();
    } catch (err) {
      alert('Failed to update status');
    }
  };

  const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
  
  const downloadBill = async (id) => {
    try {
      const token = JSON.parse(localStorage.getItem('user'))?.token;
      const downloadUrl = `${BASE}/transactions/download/${id}`;
      const response = await fetch(downloadUrl, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      if (!response.ok) throw new Error('Download failed');
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bill_${id}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      a.remove();
    } catch (error) {
      alert('Failed to download bill. Please try again.');
    }
  };
  return (
    <HODLayout>
      <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
        <Download sx={{ fontSize: 28, color: 'primary.main' }} />
        <Typography variant="h5" fontWeight={700} sx={{ letterSpacing: 0.5 }}>
          Verify Bills (Coordinator Uploads)
        </Typography>
      </Stack>
      <Card sx={{ borderRadius: 3, p: 3, mb: 4, boxShadow: '0 4px 16px rgba(25, 118, 210, 0.06)', background: '#fcfcfc' }}>
        {loading ? (
          <Stack alignItems="center" mt={4}><CircularProgress size={60} /></Stack>
        ) : (
          <>
            <Typography variant="subtitle1" fontWeight={700} mb={2} color="primary.main">
              Pending Bills
            </Typography>
            <TableContainer component={Paper} sx={{ mb: 4, borderRadius: 2, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)' }}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Date</TableCell>
                    <TableCell>Bill No</TableCell>
                    <TableCell>Purpose</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Download</TableCell>
                    <TableCell>Action</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {bills.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No pending bills to verify.</TableCell>
                    </TableRow>
                  ) : bills.map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell>{tx.billDate ? dayjs(tx.billDate).format('YYYY-MM-DD') : '-'}</TableCell>
                      <TableCell>{tx.billNo || '-'}</TableCell>
                      <TableCell>{tx.purpose || '-'}</TableCell>
                      <TableCell>₹{tx.amount?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <IconButton onClick={() => downloadBill(tx._id)}><Download /></IconButton>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" spacing={1}>
                          <Button size="small" color="success" variant="contained" onClick={() => handleVerify(tx._id, 'verified')}>Verify</Button>
                          <Button size="small" color="error" variant="outlined" onClick={() => handleVerify(tx._id, 'rejected')}>Reject</Button>
                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>

            {/* Verified/Rejected Bills Section */}
            <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
              <Typography variant="h6" fontWeight={700} color={filterStatus === 'verified' ? 'success.main' : 'error.main'}>
                {filterStatus === 'verified' ? 'Verified Bills' : 'Rejected Bills'}
              </Typography>
              {/* Dropdown filter for verified/rejected */}
              <Stack direction="row" alignItems="center" spacing={1}>
                <Typography variant="body1">Show:</Typography>
                <select
                  value={filterStatus}
                  onChange={e => setFilterStatus(e.target.value)}
                  style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ccc', fontSize: 16 }}
                >
                  <option value="verified">Verified</option>
                  <option value="rejected">Rejected</option>
                </select>
              </Stack>
            </Stack>
            <TableContainer component={Paper} sx={{ borderRadius: 2, boxShadow: '0 2px 8px rgba(25, 118, 210, 0.08)' }}>
              <Table>
                <TableHead>
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
                  {(filterStatus === 'verified' ? verifiedBills : rejectedBills).length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} align="center">No {filterStatus} bills.</TableCell>
                    </TableRow>
                  ) : (filterStatus === 'verified' ? verifiedBills : rejectedBills).map((tx) => (
                    <TableRow key={tx._id}>
                      <TableCell>{tx.billDate ? dayjs(tx.billDate).format('YYYY-MM-DD') : '-'}</TableCell>
                      <TableCell>{tx.billNo || '-'}</TableCell>
                      <TableCell>{tx.purpose || '-'}</TableCell>
                      <TableCell>₹{tx.amount?.toLocaleString() || 0}</TableCell>
                      <TableCell>
                        <span style={{ color: filterStatus === 'verified' ? 'green' : 'red', fontWeight: 'bold' }}>{filterStatus.charAt(0).toUpperCase() + filterStatus.slice(1)}</span>
                      </TableCell>
                      <TableCell>
                        <IconButton onClick={() => downloadBill(tx._id)}><Download /></IconButton>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          </>
        )}
      </Card>
    </HODLayout>
  );
};

export default VerifyBills; 