import { useEffect, useState } from 'react';
import API from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Button, TextField, Typography, List, ListItem, ListItemText, Paper,
  MenuItem, Select, FormControl, InputLabel, Box, Grid, IconButton, Dialog,
  DialogTitle, DialogContent, DialogActions, Avatar, Tooltip, 
  CircularProgress, Snackbar, Alert, Chip
} from '@mui/material';
import { Add, Delete, Edit, LockReset, Person, Check, Close } from '@mui/icons-material';
import { green, red, blue, orange } from '@mui/material/colors';
import { motion } from 'framer-motion';

const Users = () => {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '',
    department: ''
  });

  const [editDialog, setEditDialog] = useState({ open: false, user: null });
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchUsers = async () => {
    try {
      const { data } = await API.get('/users');
      setUsers(data);
    } catch (err) {
      showSnackbar('Failed to load users', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const { data } = await API.get('/departments');
      setDepartments(data);
    } catch (err) {
      showSnackbar('Failed to load departments', 'error');
    }
  };

  const addUser = async () => {
    if (!form.name || !form.email || !form.password || !form.department) {
      showSnackbar('All fields are required', 'error');
      return;
    }

    try {
      await API.post('/users', form);
      fetchUsers();
      setForm({ name: '', email: '', password: '', department: '' });
      showSnackbar('User added successfully', 'success');
    } catch (err) {
      showSnackbar(err.response?.data?.message || 'Failed to add user', 'error');
    }
  };

  const deleteUser = async (id) => {
    try {
      await API.delete(`/users/${id}`);
      fetchUsers();
      showSnackbar('User deleted successfully', 'success');
      setDeleteConfirm(null);
    } catch (err) {
      showSnackbar('Failed to delete user', 'error');
    }
  };

  const handleEditUser = (user) => {
    setEditDialog({ open: true, user });
    setNewEmail(user.email);
  };

  const saveEdit = async () => {
    try {
      await API.put(`/users/${editDialog.user._id}`, {
        email: newEmail,
        name: editDialog.user.name,
        department: editDialog.user.department?._id || editDialog.user.department
      });
      setEditDialog({ open: false, user: null });
      fetchUsers();
      showSnackbar('User updated successfully', 'success');
    } catch (err) {
      showSnackbar('Failed to update user', 'error');
    }
  };

  const resetPassword = async (id) => {
    const pwd = prompt('Enter new password:');
    if (!pwd) return;

    try {
      await API.put(`/users/reset/${id}`, { password: pwd });
      showSnackbar('Password reset successfully!', 'success');
    } catch (err) {
      showSnackbar('Password reset failed', 'error');
    }
  };

  const showSnackbar = (message, severity) => {
    setSnackbar({ open: true, message, severity });
  };

  useEffect(() => {
    fetchUsers();
    fetchDepartments();
  }, []);

  if (loading) {
    return (
      <AdminLayout>
        <Box display="flex" justifyContent="center" mt={4}>
          <CircularProgress size={60} />
        </Box>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
          Manage HoD Users
        </Typography>

        <Paper sx={{ p: 3, mb: 4, borderRadius: 3, boxShadow: 3 }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={3}>
              <TextField 
                label="Name" 
                fullWidth 
                value={form.name} 
                onChange={e => setForm({ ...form, name: e.target.value })}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField 
                label="Email" 
                fullWidth 
                value={form.email} 
                onChange={e => setForm({ ...form, email: e.target.value })}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField 
                label="Password" 
                type="password" 
                fullWidth 
                value={form.password} 
                onChange={e => setForm({ ...form, password: e.target.value })}
                variant="outlined"
                size="small"
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <FormControl fullWidth size="small">
                <InputLabel>Department</InputLabel>
                <Select 
                  value={form.department} 
                  onChange={e => setForm({ ...form, department: e.target.value })}
                  label="Department"
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept._id} value={dept._id}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={1}>
              <Tooltip title="Add User">
                <Button 
                  fullWidth 
                  variant="contained" 
                  onClick={addUser}
                  sx={{ height: '40px' }}
                >
                  <Add />
                </Button>
              </Tooltip>
            </Grid>
          </Grid>
        </Paper>

        <Paper sx={{ p: 2, borderRadius: 3, boxShadow: 3 }}>
          {users.length === 0 ? (
            <Box textAlign="center" py={4}>
              <Typography variant="body1" color="textSecondary">
                No users found. Add your first user.
              </Typography>
            </Box>
          ) : (
            <List>
              {users.map(u => (
                <ListItem 
                  key={u._id}
                  sx={{
                    mb: 1,
                    borderRadius: 2,
                    borderLeft: `4px solid ${blue[500]}`,
                    transition: 'all 0.3s',
                    '&:hover': {
                      backgroundColor: 'action.hover',
                      transform: 'translateY(-2px)',
                      boxShadow: 1
                    }
                  }}
                  secondaryAction={
                    <Box>
                      <Tooltip title="Edit User">
                        <IconButton 
                          onClick={() => handleEditUser(u)} 
                          sx={{ color: blue[500], '&:hover': { bgcolor: blue[50] } }}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Reset Password">
                        <IconButton 
                          onClick={() => resetPassword(u._id)} 
                          sx={{ color: orange[500], '&:hover': { bgcolor: orange[50] } }}
                        >
                          <LockReset />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete User">
                        <IconButton 
                          onClick={() => setDeleteConfirm(u)}
                          sx={{ color: red[500], '&:hover': { bgcolor: red[50] } }}
                        >
                          <Delete />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <Avatar sx={{ bgcolor: green[500], mr: 2 }}>
                    <Person />
                  </Avatar>
                  <ListItemText
                    primary={
                      <Box display="flex" alignItems="center">
                        <Typography fontWeight="bold">{u.name}</Typography>
                        <Chip 
                          label={u.role} 
                          size="small" 
                          sx={{ ml: 1, bgcolor: green[100], color: green[800] }} 
                        />
                      </Box>
                    }
                    secondary={
                      <Box>
                        <Typography variant="body2">{u.email}</Typography>
                        <Typography variant="body2" color="textSecondary">
                          Dept: {u.department?.name || 'N/A'}
                        </Typography>
                      </Box>
                    }
                  />
                </ListItem>
              ))}
            </List>
          )}
        </Paper>

        {/* Edit Dialog */}
        <Dialog 
          open={editDialog.open} 
          onClose={() => setEditDialog({ open: false, user: null })}
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: 'primary.main', color: 'white' }}>
            Edit User
          </DialogTitle>
          <DialogContent sx={{ p: 3, minWidth: 400 }}>
            <TextField
              label="Email"
              fullWidth
              value={newEmail}
              onChange={e => setNewEmail(e.target.value)}
              margin="normal"
              variant="outlined"
            />
            <TextField
              label="New Password (optional)"
              type="password"
              fullWidth
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
              margin="normal"
              variant="outlined"
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setEditDialog({ open: false, user: null })}
              variant="outlined"
              startIcon={<Close />}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={saveEdit}
              startIcon={<Check />}
            >
              Save Changes
            </Button>
          </DialogActions>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog 
          open={!!deleteConfirm} 
          onClose={() => setDeleteConfirm(null)}
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ bgcolor: red[500], color: 'white' }}>
            Confirm Delete
          </DialogTitle>
          <DialogContent sx={{ p: 3 }}>
            <Typography>
              Are you sure you want to delete user: <b>{deleteConfirm?.name}</b>?
            </Typography>
            <Typography variant="body2" color="textSecondary" mt={1}>
              This action cannot be undone.
            </Typography>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button 
              onClick={() => setDeleteConfirm(null)}
              variant="outlined"
              startIcon={<Close />}
            >
              Cancel
            </Button>
            <Button 
              variant="contained" 
              onClick={() => deleteUser(deleteConfirm?._id)}
              color="error"
              startIcon={<Delete />}
              sx={{ bgcolor: red[500], '&:hover': { bgcolor: red[700] } }}
            >
              Delete User
            </Button>
          </DialogActions>
        </Dialog>
      </motion.div>

      {/* Snackbar Notifications */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert 
          onClose={() => setSnackbar({ ...snackbar, open: false })} 
          severity={snackbar.severity}
          sx={{ width: '100%', borderRadius: 2 }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </AdminLayout>
  );
};

export default Users;