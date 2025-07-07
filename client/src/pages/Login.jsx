import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../services/api';
import { useAuth } from '../context/AuthContext';
import { 
  Button, 
  TextField, 
  Typography, 
  Paper, 
  Container,
  Box,
  Link,
  FormControlLabel,
  Checkbox,
  CircularProgress,
  InputAdornment,
  IconButton
} from '@mui/material';
import { Lock, Email, Visibility, VisibilityOff } from '@mui/icons-material';

const Login = () => {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const nav = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    
    if (!email || !password) {
      setError('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    
    try {
      const { data } = await API.post('/auth/login', { email, password });
      login(data, rememberMe);
      nav(data.user.role === 'admin' ? '/admin/dashboard' : '/hod/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container 
      maxWidth="xs" 
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Paper 
        elevation={6} 
        sx={{
          p: 4,
          borderRadius: 2,
          width: '100%',
          boxShadow: '0px 10px 25px rgba(0, 0, 0, 0.1)',
          background: 'linear-gradient(to bottom right, #ffffff, #f5f7fa)'
        }}
      >
        <Box textAlign="center" mb={3}>
          <Lock sx={{ 
            fontSize: 50, 
            color: 'primary.main',
            background: 'rgba(25, 118, 210, 0.1)',
            borderRadius: '50%',
            p: 1.5
          }} />
          <Typography variant="h5" component="h1" mt={2} fontWeight="600">
            Sign in to your account
          </Typography>
          <Typography variant="body2" color="text.secondary" mt={1}>
            Enter your credentials to continue
          </Typography>
        </Box>

        <form onSubmit={handleLogin}>
          <TextField
            fullWidth
            label="Email Address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Email color="action" />
                </InputAdornment>
              ),
            }}
            variant="outlined"
            autoComplete="email"
          />
          
          <TextField
            fullWidth
            type={showPassword ? 'text' : 'password'}
            label="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            margin="normal"
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Lock color="action" />
                </InputAdornment>
              ),
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                  >
                    {showPassword ? <VisibilityOff /> : <Visibility />}
                  </IconButton>
                </InputAdornment>
              )
            }}
            variant="outlined"
            autoComplete="current-password"
          />
          
          <Box sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 1
          }}>
            <FormControlLabel
              control={
                <Checkbox 
                  checked={rememberMe} 
                  onChange={(e) => setRememberMe(e.target.checked)}
                  color="primary"
                />
              }
              label="Remember me"
            />
          </Box>
          
          {error && (
            <Typography color="error" variant="body2" mt={1} textAlign="center">
              {error}
            </Typography>
          )}
          
          <Button
            fullWidth
            variant="contained"
            onClick={handleLogin}
            sx={{
              mt: 3,
              py: 1.5,
              borderRadius: 1,
              fontSize: '1rem',
              fontWeight: '600',
              textTransform: 'none'
            }}
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
          </Button>
        </form>
        
        <Box mt={3} textAlign="center">
          
        </Box>
      </Paper>
    </Container>
  );
};

export default Login;