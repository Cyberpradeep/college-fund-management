import { useState, useEffect } from 'react';
import API from '../../services/api';
import HODLayout from '../../layouts/HODLayout';

import {
  Card, CardContent, Typography, TextField, Button, Box, Stack, Alert, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Person } from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';

const CoordinatorRegister = () => {
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');
  const [hasCoordinator, setHasCoordinator] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const theme = useTheme();

  useEffect(() => {
    // Try to fetch current coordinator info (if endpoint exists)
    const fetchCoordinator = async () => {
      try {
        const { data } = await API.get('/departments/hod/coordinator');
        if (data && data.name && data.email) {
          setForm({ name: data.name, email: data.email, password: '' });
          setHasCoordinator(true);
        }
      } catch (err) {
        setHasCoordinator(false);
      }
    };
    fetchCoordinator();
  }, []);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await API.post('/departments/hod/coordinator', form);
      setSuccess('Coordinator registered/updated successfully!');
      setHasCoordinator(true);
      setForm({ ...form, password: '' });
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to register/update coordinator.');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    setError('');
    setSuccess('');
    setLoading(true);
    try {
      await API.delete('/departments/hod/coordinator');
      setSuccess('Coordinator deleted successfully!');
      setForm({ name: '', email: '', password: '' });
      setHasCoordinator(false);
      setConfirmOpen(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete coordinator.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <HODLayout>
      <Box sx={{
        minHeight: '80vh',
        background: 'linear-gradient(135deg, #f5f8ff 0%, #f8fafc 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        py: { xs: 2, sm: 4, md: 6 },
        px: { xs: 1, sm: 2 },
      }}>
        <Card sx={{
          width: '100%',
          maxWidth: 440,
          minWidth: { xs: '100%', sm: 340, md: 380 },
          p: 0,
          borderRadius: 4,
          boxShadow: '0 8px 32px 0 rgba(25, 118, 210, 0.10)',
          mx: { xs: 0, sm: 2 },
          // Reduce vertical padding and content spacing for a more compact card
        }}>
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            pt: { xs: 2, sm: 2.5 },
            pb: { xs: 1, sm: 1.2 },
            background: 'linear-gradient(90deg, #e3f2fd 0%, #f5f8ff 100%)',
            borderTopLeftRadius: 16,
            borderTopRightRadius: 16,
          }}>
            <Box sx={{ mb: 1 }}>
              <Box sx={{
                width: 60,
                height: 60,
                borderRadius: '50%',
                background: hasCoordinator ? theme.palette.primary.light : theme.palette.primary.light,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 2px 8px 0 #1976d233',
              }}>
                <Person sx={{ fontSize: 36, color: hasCoordinator ? 'primary.main' : 'primary.main' }} />
              </Box>
            </Box>
            <Typography variant="h5" fontWeight={700} color={hasCoordinator ? 'primary.main' : 'primary.main'}>
              {hasCoordinator ? 'Update Coordinator' : 'Register Coordinator'}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, mb: 1.5 }}>
              {hasCoordinator ? 'Edit or remove the current coordinator for your department.' : 'Register a new coordinator for your department.'}
            </Typography>
          </Box>
          <CardContent sx={{ pt: 1.5, pb: 2, px: 2.5 }}>
            {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}
            {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
            <form onSubmit={handleSubmit} autoComplete="off">
              <Stack spacing={1.5}>
                <TextField
                  label="Name"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <TextField
                  label="Email"
                  name="email"
                  type="email"
                  value={form.email}
                  onChange={handleChange}
                  required
                  fullWidth
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 2 } }}
                />
                <TextField
                  label="Password"
                  name="password"
                  type="password"
                  value={form.password}
                  onChange={handleChange}
                  required={!hasCoordinator}
                  fullWidth
                  variant="outlined"
                  InputProps={{ sx: { borderRadius: 2 } }}
                  helperText={hasCoordinator ? 'Leave blank to keep current password' : ''}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ fontWeight: 600, py: 1.2, borderRadius: 2, fontSize: 16, boxShadow: '0 2px 8px 0 #1976d233', background: 'linear-gradient(90deg, #1976d2 0%, #1565c0 100%)' }}
                  fullWidth
                >
                  {loading ? 'Submitting...' : hasCoordinator ? 'Update' : 'Register'}
                </Button>
                {hasCoordinator && (
                  <>
                    <Box sx={{ my: 1 }}>
                      <Box sx={{ borderBottom: '1px solid', borderColor: 'divider', width: '100%' }} />
                    </Box>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={() => setConfirmOpen(true)}
                      disabled={loading}
                      fullWidth
                      sx={{ fontWeight: 600, borderRadius: 2, fontSize: 15 }}
                    >
                      Delete Coordinator
                    </Button>
                  </>
                )}
              </Stack>
            </form>
          </CardContent>
        </Card>
      </Box>
      <Dialog open={confirmOpen} onClose={() => setConfirmOpen(false)}>
        <DialogTitle>Delete Coordinator</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete the coordinator for your department?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmOpen(false)} color="primary">Cancel</Button>
          <Button onClick={handleDelete} color="error" variant="contained">Delete</Button>
        </DialogActions>
      </Dialog>
    </HODLayout>
  );
};

export default CoordinatorRegister; 