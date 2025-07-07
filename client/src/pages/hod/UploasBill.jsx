import { useEffect, useState } from 'react';
import API from '../../services/api';
import HODLayout from '../../layouts/HODLayout';
import {
  Button,
  TextField,
  Typography,
  Box,
  Paper,
  Grid,
  InputAdornment,
  FormControl,
  Chip,
  Stack,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Divider,
  CircularProgress
} from '@mui/material';
import {
  Description,
  CalendarToday,
  Paid,
  AttachFile,
  CloudUpload,
  Clear,
  Download,
  History,
  RestartAlt
} from '@mui/icons-material';

const UploadBill = () => {
  const [form, setForm] = useState({
    billNo: '',
    billDate: '',
    purpose: '',
    amount: ''
  });
  const [files, setFiles] = useState([]);
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  const fetchUploads = async () => {
    setLoading(true);
    try {
      const { data } = await API.get('/transactions/my');
      setHistory(data);
    } catch (err) {
      console.error('Failed to fetch uploads:', err);
    } finally {
      setLoading(false);
    }
  };

  const upload = async () => {
    if (files.length === 0) {
      alert('Please upload at least one PDF file');
      return;
    }
    
    setUploading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      for (let file of files) formData.append('bills', file);

      await API.post('/transactions/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      alert('Bill submitted for verification!');
      resetForm();
      fetchUploads();
    } catch (err) {
      console.error('Upload failed:', err);
      alert('Failed to submit bill. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const resetForm = () => {
    setForm({ billNo: '', billDate: '', purpose: '', amount: '' });
    setFiles([]);
  };

  const removeFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';
 const download = async (id) => {
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

  useEffect(() => {
    fetchUploads();
  }, []);

  return (
    <HODLayout>
      {/* Upload Form Section */}
      <Paper elevation={0} sx={{ 
        p: 4, 
        mb: 4, 
        borderRadius: 3, 
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <Description sx={{ fontSize: 36, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Bill Submission
          </Typography>
        </Stack>

        <Box component="div" sx={{ maxWidth: '800px' }}>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Bill Number"
                value={form.billNo}
                onChange={e => setForm({ ...form, billNo: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Description color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="date"
                label="Bill Date"
                InputLabelProps={{ shrink: true }}
                value={form.billDate}
                onChange={e => setForm({ ...form, billDate: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CalendarToday color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Purpose of Expenditure"
                value={form.purpose}
                onChange={e => setForm({ ...form, purpose: e.target.value })}
                multiline
                rows={3}
                placeholder="Describe the purpose of this expenditure..."
              />
            </Grid>

            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                type="number"
                label="Amount (₹)"
                value={form.amount}
                onChange={e => setForm({ ...form, amount: e.target.value })}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Paid color="action" />
                    </InputAdornment>
                  )
                }}
              />
            </Grid>

            <Grid item xs={12}>
              <FormControl fullWidth>
                <Button
                  variant="outlined"
                  component="label"
                  startIcon={<AttachFile />}
                  color={files.length > 0 ? "primary" : "inherit"}
                  sx={{
                    py: 2,
                    borderStyle: 'dashed',
                    borderWidth: 1.5,
                    backgroundColor: files.length > 0 ? 'rgba(25, 118, 210, 0.04)' : 'transparent',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      borderStyle: 'solid'
                    }
                  }}
                >
                  <CloudUpload sx={{ mr: 1, fontSize: 28 }} />
                  <Box textAlign="center">
                    <Typography variant="body1" fontWeight={500}>
                      {files.length > 0 ? `${files.length} PDF file(s) selected` : 'Upload Bill Documents'}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      (Only PDF files accepted, max 10MB each)
                    </Typography>
                  </Box>
                  <input
                    type="file"
                    hidden
                    multiple
                    accept="application/pdf"
                    onChange={(e) => setFiles([...e.target.files])}
                  />
                </Button>
              </FormControl>

              {files.length > 0 && (
                <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
                  {files.map((file, index) => (
                    <Chip
                      key={index}
                      label={file.name}
                      onDelete={() => removeFile(index)}
                      deleteIcon={<Clear />}
                      variant="outlined"
                      sx={{ 
                        mb: 1, 
                        borderRadius: 1,
                        maxWidth: 250,
                        '& .MuiChip-label': {
                          overflow: 'hidden',
                          textOverflow: 'ellipsis'
                        }
                      }}
                    />
                  ))}
                </Stack>
              )}
            </Grid>

            <Grid item xs={12}>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Button
                  variant="contained"
                  onClick={upload}
                  size="large"
                  startIcon={uploading ? <CircularProgress size={20} color="inherit" /> : <CloudUpload />}
                  disabled={uploading}
                  sx={{
                    px: 4,
                    py: 1.5,
                    minWidth: 180,
                    fontWeight: 600
                  }}
                >
                  {uploading ? 'Submitting...' : 'Submit Bill'}
                </Button>
                
                <Button
                  variant="outlined"
                  onClick={resetForm}
                  size="large"
                  startIcon={<RestartAlt />}
                  sx={{
                    px: 4,
                    py: 1.5,
                    minWidth: 150
                  }}
                >
                  Reset Form
                </Button>
              </Stack>
            </Grid>
          </Grid>
        </Box>
      </Paper>

      {/* Submitted Bills Section */}
      <Paper elevation={0} sx={{ 
        p: 3, 
        borderRadius: 3, 
        border: '1px solid',
        borderColor: 'divider',
        boxShadow: '0 4px 20px rgba(0, 0, 0, 0.05)'
      }}>
        <Stack direction="row" alignItems="center" spacing={1.5} mb={3}>
          <History sx={{ fontSize: 32, color: 'primary.main' }} />
          <Typography variant="h5" fontWeight={600}>
            Submitted Bills History
          </Typography>
        </Stack>

        {loading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : history.length === 0 ? (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="text.secondary">
              No bills submitted yet
            </Typography>
          </Box>
        ) : (
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
                {history.map((bill) => (
                  <TableRow key={bill._id} hover>
                    <TableCell>{bill.billNo}</TableCell>
                    <TableCell sx={{ maxWidth: 300 }}>{bill.purpose}</TableCell>
                    <TableCell align="right" sx={{ fontWeight: 500 }}>
                      ₹{bill.amount.toLocaleString()}
                    </TableCell>
                    <TableCell>{bill.billDate?.slice(0, 10)}</TableCell>
                    <TableCell>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          display: 'inline-block',
                          px: 1.5,
                          py: 0.5,
                          borderRadius: 1,
                          bgcolor: bill.status === 'verified' ? 'success.light' : 
                                   bill.status === 'pending' ? 'warning.light' : 
                                   'error.light',
                          color: bill.status === 'verified' ? 'success.dark' : 
                                 bill.status === 'pending' ? 'warning.dark' : 
                                 'error.dark',
                          fontWeight: 500
                        }}
                      >
                        {bill.status.charAt(0).toUpperCase() + bill.status.slice(1)}
                      </Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton
                        size="small"
                        onClick={() => download(bill._id)}
                        color="primary"
                        sx={{ 
                          border: '1px solid',
                          borderColor: 'primary.main',
                          borderRadius: 1,
                          '&:hover': {
                            backgroundColor: 'primary.light'
                          }
                        }}
                      >
                        <Download fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </HODLayout>
  );
};

export default UploadBill;