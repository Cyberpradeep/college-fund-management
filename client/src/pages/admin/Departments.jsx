import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import API from '../../services/api';
import AdminLayout from '../../layouts/AdminLayout';
import {
  Button,
  TextField,
  Typography,
  List,
  ListItem,
  ListItemText,
  Box,
  Paper,
  Stack,
  IconButton,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  useTheme
} from '@mui/material';
import { Add, Edit, Delete } from '@mui/icons-material';

const Departments = () => {
  const [depts, setDepts] = useState([]);
  const [form, setForm] = useState({ name: '', description: '', email: '', password: '' });
  const [editForm, setEditForm] = useState({ _id: '', name: '', description: '', email: '', password: '' });
  const [editOpen, setEditOpen] = useState(false);

  const theme = useTheme();

  const fetchDepts = async () => {
    const { data } = await API.get('/departments');
    setDepts(data);
  };

  const addDept = async () => {
    try {
      await API.post('/departments', form);
      setForm({ name: '', description: '', email: '', password: '' });
      fetchDepts();
    } catch (err) {
      alert('Failed to create department with user');
    }
  };

  const openEdit = (dept) => {
    setEditForm({
      _id: dept._id,
      name: dept.name,
      description: dept.description,
      email: dept.hod?.email || '',
      password: ''
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    try {
      const { _id, name, description, email, password } = editForm;
      await API.put(`/departments/${_id}`, { name, description });
      if (email) await API.put(`/departments/${_id}/hod/email`, { email });
      if (password) await API.put(`/departments/${_id}/hod/password`, { password });
      setEditOpen(false);
      fetchDepts();
    } catch (err) {
      alert('Update failed');
    }
  };

  const deleteDepartment = async (id) => {
    if (confirm('Are you sure you want to delete this department and its HOD?')) {
      await API.delete(`/departments/${id}`);
      fetchDepts();
    }
  };

  useEffect(() => {
    fetchDepts();
  }, []);

  return (
    <AdminLayout>
      <Typography variant="h5" fontWeight={700} mb={3} color="primary" sx={{ 
        borderBottom: `2px solid ${theme.palette.primary.main}`, 
        pb: 1,
        display: 'inline-block'
      }}>
        Department Management
      </Typography>

      {/* Add Department Form */}
      <Paper sx={{ 
        p: 3, 
        mb: 4, 
        borderRadius: 2, 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="subtitle1" fontWeight={600} mb={3} color="text.primary">
          Create New Department
        </Typography>
        
        <Stack spacing={2.5}>
          <TextField 
            label="Department Name" 
            variant="outlined"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            size="small" 
            fullWidth 
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              }
            }}
          />
          <TextField 
            label="Description" 
            variant="outlined"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
            size="small" 
            fullWidth 
            multiline 
            rows={3}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              }
            }}
          />
          <Stack direction="row" spacing={2} sx={{ 
            '& > *': { 
              flex: 1,
              '& .MuiOutlinedInput-root': {
                borderRadius: 1,
              }
            } 
          }}>
            <TextField 
              label="HOD Email" 
              type="email" 
              variant="outlined"
              value={form.email}
              onChange={e => setForm({ ...form, email: e.target.value })}
              size="small"
            />
            <TextField 
              label="HOD Password" 
              type="password" 
              variant="outlined"
              value={form.password}
              onChange={e => setForm({ ...form, password: e.target.value })}
              size="small"
            />
          </Stack>
          <Button 
            variant="contained" 
            onClick={addDept} 
            startIcon={<Add />} 
            sx={{ 
              alignSelf: 'flex-start',
              px: 4,
              py: 1.5,
              fontWeight: 600,
              textTransform: 'none',
              borderRadius: 1,
              boxShadow: '0 3px 8px rgba(25, 118, 210, 0.2)',
              '&:hover': {
                boxShadow: '0 5px 12px rgba(25, 118, 210, 0.3)'
              }
            }}
          >
            Add Department & HOD
          </Button>
        </Stack>
      </Paper>

      {/* Department List */}
      <Paper sx={{ 
        p: 2, 
        borderRadius: 2, 
        boxShadow: '0 4px 12px rgba(0, 0, 0, 0.08)',
        border: `1px solid ${theme.palette.divider}`
      }}>
        <Typography variant="subtitle1" fontWeight={600} mb={2} color="text.primary">
          Department List
        </Typography>
        
        <List disablePadding>
          {depts.map((d, index) => (
            <Box key={d._id}>
              <ListItem
                sx={{ 
                  py: 2.5, 
                  px: 2,
                  borderRadius: 1,
                  mb: 1,
                  backgroundColor: theme.palette.background.paper,
                  transition: '0.3s',
                  '&:hover': { 
                    backgroundColor: theme.palette.action.hover,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
                    transform: 'translateY(-2px)'
                  } 
                }}
                secondaryAction={
                  <Stack direction="row" spacing={1.5} alignItems="center">
                    <IconButton 
                      onClick={() => openEdit(d)} 
                      color="primary" 
                      size="small"
                      sx={{ 
                        border: `1px solid ${theme.palette.primary.light}`,
                        borderRadius: 1,
                        backgroundColor: 'rgba(25, 118, 210, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(25, 118, 210, 0.2)'
                        }
                      }}
                    >
                      <Edit fontSize="small" />
                    </IconButton>
                    <IconButton 
                      onClick={() => deleteDepartment(d._id)} 
                      color="error" 
                      size="small"
                      sx={{ 
                        border: `1px solid ${theme.palette.error.light}`,
                        borderRadius: 1,
                        backgroundColor: 'rgba(244, 67, 54, 0.1)',
                        '&:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.2)'
                        }
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                    <Button 
                      component={Link} 
                      to={`/admin/departments/${d._id}`} 
                      variant="outlined" 
                      size="small"
                      sx={{
                        textTransform: 'none',
                        fontWeight: 500,
                        px: 2.5,
                        py: 0.8,
                        borderRadius: 1,
                        ml: 1
                      }}
                    >
                      View Details
                    </Button>
                  </Stack>
                }
              >
                <ListItemText
                  primary={
                    <Typography fontWeight={700} variant="subtitle1" color="text.primary">
                      {d.name}
                    </Typography>
                  }
                  secondary={
                    <Stack mt={1} spacing={0.5}>
                      <Typography variant="body2" color="text.secondary">
                        {d.description}
                      </Typography>
                      {d.hod?.email && (
                        <Typography variant="body2" mt={0.5}>
                          <Box component="span" fontWeight={500} color="text.secondary">HOD:</Box> 
                          <Box component="span" color="primary.main" ml={1.5}>
                            {d.hod.email}
                          </Box>
                        </Typography>
                      )}
                    </Stack>
                  }
                  sx={{ pr: 25 }}
                />
              </ListItem>
              {index < depts.length - 1 && <Divider sx={{ mx: 2 }} />}
            </Box>
          ))}
        </List>
      </Paper>

      {/* Edit Modal */}
      <Dialog 
        open={editOpen} 
        onClose={() => setEditOpen(false)} 
        fullWidth 
        maxWidth="sm"
        PaperProps={{ 
          sx: { 
            borderRadius: 2,
            boxShadow: '0 8px 32px rgba(0,0,0,0.2)'
          } 
        }}
      >
        <DialogTitle sx={{ 
          bgcolor: 'primary.main', 
          color: 'white',
          fontWeight: 600,
          py: 1.5,
          borderTopLeftRadius: 8,
          borderTopRightRadius: 8
        }}>
          Edit Department & HOD
        </DialogTitle>
        <DialogContent sx={{ pt: 3, pb: 1 }}>
          <Stack spacing={3}>
            <TextField 
              label="Department Name" 
              variant="outlined"
              fullWidth 
              size="small" 
              value={editForm.name} 
              onChange={e => setEditForm({ ...editForm, name: e.target.value })} 
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                }
              }}
            />
            <TextField 
              label="Description" 
              variant="outlined"
              fullWidth 
              size="small" 
              value={editForm.description} 
              multiline 
              rows={3} 
              onChange={e => setEditForm({ ...editForm, description: e.target.value })} 
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                }
              }}
            />
            <TextField 
              label="HOD Email" 
              variant="outlined"
              fullWidth 
              size="small" 
              value={editForm.email} 
              onChange={e => setEditForm({ ...editForm, email: e.target.value })} 
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                }
              }}
            />
            <TextField 
              label="New Password (optional)" 
              type="password" 
              variant="outlined"
              fullWidth 
              size="small" 
              value={editForm.password} 
              onChange={e => setEditForm({ ...editForm, password: e.target.value })} 
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 1,
                }
              }}
            />
          </Stack>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => setEditOpen(false)} 
            variant="outlined"
            sx={{ 
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 1
            }}
          >
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleEditSave}
            sx={{ 
              fontWeight: 600,
              px: 3,
              py: 1,
              borderRadius: 1,
              boxShadow: '0 3px 8px rgba(25, 118, 210, 0.3)',
              '&:hover': {
                boxShadow: '0 5px 12px rgba(25, 118, 210, 0.4)'
              }
            }}
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </AdminLayout>
  );
};

export default Departments;