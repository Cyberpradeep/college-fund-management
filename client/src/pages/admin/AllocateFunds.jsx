import { useEffect, useState } from 'react';
import API from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import { 
  Button, 
  TextField, 
  Typography, 
  MenuItem, 
  Select, 
  FormControl, 
  InputLabel, 
  Box,
  Paper,
  Grid,
  useTheme,
  CircularProgress,
  Alert,
  Container
} from '@mui/material';
import { AttachMoney, Send, MonetizationOn } from '@mui/icons-material';

const AllocateFunds = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [semester, setSemester] = useState('');
  const [year, setYear] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [error, setError] = useState('');
  const theme = useTheme();

  const fetchDepartments = async () => {
    const { data } = await API.get('/departments');
    setDepartments(data);
  };

  const allocate = async () => {
    setError('');
    if (selectedDept && amount && semester && year && startDate && endDate) {
      setLoading(true);
      try {
        await API.post(`/departments/allocate/${selectedDept}`, {
          amount: Number(amount),
          semester,
          year,
          startDate,
          endDate
        });
        setSuccess(true);
        setAmount('');
        setSemester('');
        setYear('');
        setStartDate('');
        setEndDate('');
        fetchDepartments();
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        setError(error.response?.data?.message || 'Allocation failed');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchDepartments();
  }, []);

  return (
    <AdminLayout>
      <Container
        maxWidth="xs"
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          px: { xs: 1, sm: 2 },
        }}
      >
        <Paper
          elevation={6}
          sx={{
            p: { xs: 2, sm: 3.5 },
            borderRadius: 3,
            width: '100%',
            maxWidth: 440,
            boxShadow: '0px 10px 25px rgba(25, 118, 210, 0.10)',
            background: 'linear-gradient(135deg, #f5f8ff 0%, #f8fafc 100%)',
          }}
        >
          <Box textAlign="center" mb={2.5}>
            <Box sx={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: theme.palette.primary.light,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              mx: 'auto',
              boxShadow: '0 2px 8px 0 #1976d233',
              mb: 1,
            }}>
              <MonetizationOn sx={{ fontSize: 36, color: 'primary.main' }} />
            </Box>
            <Typography variant="h5" fontWeight={700} color="primary.main">
              Allocate Funds
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
              Allocate funds to a department for a semester
            </Typography>
          </Box>
          {success && (
            <Alert severity="success" sx={{ mb: 2, fontWeight: 600, fontSize: 15, borderRadius: 2 }}>
              Funds allocated successfully!
            </Alert>
          )}
          {error && (
            <Alert severity="error" sx={{ mb: 2, fontWeight: 600, fontSize: 15, borderRadius: 2 }}>
              {error}
            </Alert>
          )}
          <form>
            <FormControl fullWidth sx={{ mb: 1.5 }}>
              <InputLabel>Select Department</InputLabel>
              <Select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                label="Select Department"
                variant="outlined"
                sx={{ borderRadius: 2 }}
              >
                {departments.map((d) => (
                  <MenuItem key={d._id} value={d._id}>{d.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              fullWidth
              type="number"
              label="Allocation Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              variant="outlined"
              sx={{ mb: 1.5 }}
              InputProps={{
                startAdornment: (
                  <AttachMoney sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                ),
                sx: { borderRadius: 2 },
              }}
            />
            <Box display="flex" gap={1.5} mb={1.5}>
              <FormControl fullWidth>
                <InputLabel>Semester</InputLabel>
                <Select
                  value={semester}
                  onChange={e => setSemester(e.target.value)}
                  label="Semester"
                  variant="outlined"
                  sx={{ borderRadius: 2 }}
                >
                  <MenuItem value="">Select</MenuItem>
                  {[...Array(8)].map((_, i) => (
                    <MenuItem key={i+1} value={i+1}>{i+1}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                fullWidth
                type="number"
                label="Year"
                value={year}
                onChange={e => setYear(e.target.value)}
                variant="outlined"
                placeholder="e.g. 2024"
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Box>
            <Box display="flex" gap={1.5} mb={1.5}>
              <TextField
                fullWidth
                type="date"
                label="Start Date"
                InputLabelProps={{ shrink: true }}
                value={startDate}
                onChange={e => setStartDate(e.target.value)}
                variant="outlined"
                InputProps={{ sx: { borderRadius: 2 } }}
              />
              <TextField
                fullWidth
                type="date"
                label="End Date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={e => setEndDate(e.target.value)}
                variant="outlined"
                InputProps={{ sx: { borderRadius: 2 } }}
              />
            </Box>
            <Button
              fullWidth
              variant="contained"
              onClick={allocate}
              disabled={!selectedDept || !amount || !semester || !year || !startDate || !endDate || loading}
              sx={{
                mt: 1.5,
                py: 1.2,
                borderRadius: 2,
                fontSize: 16,
                fontWeight: 700,
                textTransform: 'none',
                boxShadow: '0 2px 8px 0 #1976d233',
                background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)',
              }}
              endIcon={loading ? <CircularProgress size={20} /> : <Send />}
            >
              {loading ? 'Allocating...' : 'Allocate Funds'}
            </Button>
          </form>
          <Box mt={2.5} textAlign="center">
            <Typography variant="body2" color="text.secondary" fontWeight={500}>
              <strong>Note:</strong> Funds allocated will be immediately available to the selected department.<br />
              Please verify the amount before confirming.
            </Typography>
          </Box>
        </Paper>
      </Container>
    </AdminLayout>
  );
};

export default AllocateFunds;