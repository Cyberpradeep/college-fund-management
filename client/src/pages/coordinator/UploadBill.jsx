
import React, { useState, useRef } from 'react';
import API from '../../services/api';
import { 
  Box, 
  Typography, 
  Button, 
  TextField, 
  Paper, 
  Stack, 
  CircularProgress, 
  Alert, 
  MenuItem,
  Grid,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  IconButton
} from '@mui/material';
import CoordinatorLayout from '../../layouts/CoordinatorLayout';
import { 
  CloudUpload, 
  Description, 
  Delete,
  CheckCircle,
  Error
} from '@mui/icons-material';

const UploadBill = () => {
  const [form, setForm] = useState({ purpose: '', amount: '', semester: '' });
  const [files, setFiles] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [timestamp, setTimestamp] = useState(new Date());
  const semesters = Array.from({ length: 8 }, (_, i) => (i + 1).toString());
  const [dragActive, setDragActive] = useState(false);
  const dropRef = useRef(null);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleFileChange = (e) => {
    setFiles(prev => [...prev, ...Array.from(e.target.files)]);
  };

  const handleRemoveFile = (index) => {
    const newFiles = [...files];
    newFiles.splice(index, 1);
    setFiles(newFiles);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
  };
  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles(prev => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };

  const handleUpload = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!form.purpose || !form.amount || !form.semester) {
      setError('Purpose, amount, and semester are required.');
      return;
    }
    if (files.length === 0) {
      setError('Please upload at least one document.');
      return;
    }
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append('purpose', form.purpose);
      formData.append('amount', form.amount);
      formData.append('semester', form.semester);
      files.forEach(file => formData.append('bills', file));
      await API.post('/transactions/coordinator/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setSuccess('Bill uploaded successfully!');
      setForm({ purpose: '', amount: '', semester: '' });
      setFiles([]);
      setTimestamp(new Date());
    } catch (err) {
      setError(err.response?.data?.message || 'Upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  return (
    <CoordinatorLayout>
      <Typography variant="h4" sx={{ 
        mb: 3, 
        fontWeight: 'bold', 
        color: 'primary.main',
        textAlign: 'center'
      }}>
        Upload Bill
      </Typography>
      
      <Grid container justifyContent="center">
        <Grid item xs={12} md={8} lg={6}>
          <Card sx={{ 
            borderRadius: 3,
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            overflow: 'visible'
          }}>
            <CardContent>
              <Typography variant="h5" sx={{ 
                mb: 3, 
                fontWeight: 600,
                color: 'text.primary',
                textAlign: 'center'
              }}>
                Bill Information
              </Typography>
              
              <form onSubmit={handleUpload}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Purpose"
                      name="purpose"
                      value={form.purpose}
                      onChange={handleChange}
                      required
                      fullWidth
                      variant="outlined"
                      size="medium"
                      InputProps={{
                        style: { borderRadius: 12 }
                      }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      label="Amount (₹)"
                      name="amount"
                      type="number"
                      value={form.amount}
                      onChange={handleChange}
                      required
                      fullWidth
                      variant="outlined"
                      size="medium"
                      InputProps={{
                        style: { borderRadius: 12 },
                        startAdornment: <Typography sx={{ mr: 1 }}>₹</Typography>
                      }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      select
                      label="Semester"
                      name="semester"
                      value={form.semester}
                      onChange={handleChange}
                      required
                      sx={{ minWidth: 180 }}
                      variant="outlined"
                      size="medium"
                      InputProps={{
                        style: { borderRadius: 12 }
                      }}
                    >
                      {semesters.map((sem) => (
                        <MenuItem key={sem} value={sem}>Semester {sem}</MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  
                  {/* Drag and Drop Zone */}
                  <Grid item xs={12}>
                    <Box
                      ref={dropRef}
                      onDragOver={handleDragOver}
                      onDragLeave={handleDragLeave}
                      onDrop={handleDrop}
                      sx={{
                        border: dragActive ? '2px solid #1976d2' : '2px dashed #bdbdbd',
                        borderRadius: 2,
                        p: 3,
                        textAlign: 'center',
                        bgcolor: dragActive ? '#e3f2fd' : '#fafafa',
                        color: '#616161',
                        cursor: 'pointer',
                        transition: 'border 0.2s, background 0.2s',
                        mb: 1
                      }}
                    >
                      <Typography variant="body1" sx={{ mb: 1 }}>
                        Drag & drop documents here, or
                      </Typography>
                      <Button
                        variant="outlined"
                        component="label"
                        color="primary"
                        fullWidth
                        sx={{
                          p: 2,
                          borderStyle: 'dashed',
                          borderWidth: 2,
                          borderRadius: 2,
                          borderColor: 'primary.main',
                          backgroundColor: 'primary.light',
                          '&:hover': {
                            backgroundColor: 'primary.lighter',
                            borderColor: 'primary.dark'
                          }
                        }}
                        startIcon={<CloudUpload fontSize="large" />}
                      >
                        <Typography variant="body1" fontWeight={600}>
                          Select Bill Documents
                        </Typography>
                        <input
                          type="file"
                          accept=".pdf,.doc,.docx,.jpg,.jpeg,.png"
                          multiple
                          hidden
                          onChange={handleFileChange}
                        />
                      </Button>
                    </Box>
                    
                    <Typography variant="body2" sx={{ mt: 1, textAlign: 'center', color: 'text.secondary' }}>
                      (PDF, DOC, JPG, PNG up to 5MB each)
                    </Typography>
                  </Grid>
                  
                  {files.length > 0 && (
                    <Grid item xs={12}>
                      <Card variant="outlined" sx={{ borderRadius: 2 }}>
                        <CardContent>
                          <Typography variant="h6" sx={{ mb: 1, fontWeight: 600 }}>
                            Selected Files:
                          </Typography>
                          <List dense sx={{ maxHeight: 200, overflow: 'auto' }}>
                            {files.map((file, idx) => (
                              <ListItem 
                                key={idx} 
                                sx={{ 
                                  borderBottom: '1px solid #eee',
                                  '&:last-child': { borderBottom: 'none' }
                                }}
                                secondaryAction={
                                  <IconButton 
                                    edge="end" 
                                    onClick={() => handleRemoveFile(idx)}
                                    color="error"
                                  >
                                    <Delete />
                                  </IconButton>
                                }
                              >
                                <ListItemIcon>
                                  <Description color="primary" />
                                </ListItemIcon>
                                <ListItemText 
                                  primary={file.name} 
                                  secondary={`${(file.size / 1024).toFixed(1)} KB`} 
                                />
                              </ListItem>
                            ))}
                          </List>
                        </CardContent>
                      </Card>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Card sx={{ 
                      backgroundColor: 'background.default',
                      borderRadius: 2,
                      p: 2
                    }}>
                      <Typography variant="body1" sx={{ fontWeight: 500 }}>
                        <strong>Upload Timestamp:</strong> {timestamp.toLocaleString()}
                      </Typography>
                    </Card>
                  </Grid>
                  
                  {(error || success) && (
                    <Grid item xs={12}>
                      <Alert 
                        severity={error ? "error" : "success"} 
                        icon={error ? <Error /> : <CheckCircle />}
                        sx={{ borderRadius: 2 }}
                      >
                        {error || success}
                      </Alert>
                    </Grid>
                  )}
                  
                  <Grid item xs={12}>
                    <Button
                      type="submit"
                      variant="contained"
                      color="success"
                      disabled={uploading}
                      fullWidth
                      size="large"
                      sx={{
                        p: 1.5,
                        borderRadius: 2,
                        fontWeight: 700,
                        fontSize: '1.1rem',
                        boxShadow: '0 4px 12px rgba(46, 125, 50, 0.3)',
                        '&:hover': {
                          boxShadow: '0 6px 16px rgba(46, 125, 50, 0.4)'
                        }
                      }}
                    >
                      {uploading ? (
                        <CircularProgress size={24} color="inherit" />
                      ) : (
                        'Submit Bill'
                      )}
                    </Button>
                  </Grid>
                </Grid>
              </form>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </CoordinatorLayout>
  );
};

export default UploadBill;
