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
  Alert
} from '@mui/material';
import { AttachMoney, Send } from '@mui/icons-material';

const AllocateFunds = () => {
  const [departments, setDepartments] = useState([]);
  const [selectedDept, setSelectedDept] = useState('');
  const [amount, setAmount] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const theme = useTheme();

  const fetchDepartments = async () => {
    const { data } = await API.get('/departments');
    setDepartments(data);
  };

  const allocate = async () => {
    if (selectedDept && amount) {
      setLoading(true);
      try {
        await API.post(`/departments/allocate/${selectedDept}`, { amount: Number(amount) });
        setSuccess(true);
        setAmount('');
        fetchDepartments();
        
        // Auto-hide success message
        setTimeout(() => setSuccess(false), 3000);
      } catch (error) {
        console.error("Allocation failed:", error);
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
      <Typography variant="h5" fontWeight="bold" mb={2}>
        Allocate Funds
      </Typography>
      
      {success && (
        <Alert severity="success" sx={{ mb: 3 }}>
          Funds allocated successfully!
        </Alert>
      )}

      <Paper elevation={2} sx={{ p: 3, maxWidth: 600 }}>
        <Grid container spacing={3}>
          <Grid item xs={12}>
            <FormControl fullWidth>
              <InputLabel>Select Department</InputLabel>
              <Select
                value={selectedDept}
                onChange={(e) => setSelectedDept(e.target.value)}
                label="Select Department"
                variant="outlined"
                // Increased width for the dropdown
                sx={{ minWidth: '300px' }}
              >
                {departments.map((d) => (
                  <MenuItem 
                    key={d._id} 
                    value={d._id} 
                    sx={{ 
                      display: 'flex', 
                      alignItems: 'center',
                      minWidth: '300px'  // Ensure menu items match width
                    }}
                  >
                    <Box sx={{ 
                      width: 12, 
                      height: 12, 
                      bgcolor: theme.palette.primary.main, 
                      borderRadius: '50%', 
                      mr: 2 
                    }} />
                    {d.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          
          <Grid item xs={12}>
            <TextField
              fullWidth
              type="number"
              label="Allocation Amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              variant="outlined"
              InputProps={{
                startAdornment: (
                  <AttachMoney sx={{ color: theme.palette.text.secondary, mr: 1 }} />
                )
              }}
            />
          </Grid>
          
          <Grid item xs={12}>
            <Button 
              variant="contained" 
              onClick={allocate}
              disabled={!selectedDept || !amount || loading}
              fullWidth
              size="large"
              endIcon={loading ? <CircularProgress size={20} /> : <Send />}
              sx={{
                py: 1.5,
                fontWeight: 'bold',
                background: 'linear-gradient(45deg, #1976d2 30%, #21CBF3 90%)',
                boxShadow: '0 3px 5px 2px rgba(33, 203, 243, .3)',
              }}
            >
              {loading ? 'Allocating...' : 'Allocate Funds'}
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      <Box mt={4}>
        <Typography variant="body1" color="text.secondary">
          <strong>Note:</strong> Funds allocated will be immediately available to the selected department. 
          Please verify the amount before confirming.
        </Typography>
      </Box>
    </AdminLayout>
  );
};

export default AllocateFunds;