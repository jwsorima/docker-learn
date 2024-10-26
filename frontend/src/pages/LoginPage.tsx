import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  Typography,
  Container,
  CssBaseline,
  Avatar,
  ThemeProvider,
  Link,
  CircularProgress,
} from '@mui/material';
import SchoolIcon from '@mui/icons-material/School';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';
import { login } from '../utils/auth';

interface Errors {
  email?: string;
  password?: string;
}

export default function AdmissionLoginPage() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [errors, setErrors] = useState<Errors>({});
  const [loginStatus, setLoginStatus] = useState<{ message: string; success: boolean } | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const validateField = (name: string, value: string): string => {
    switch (name) {
      case 'email':
        return value ? '' : 'Please provide your email address';
      case 'password':
        return value ? '' : 'Please enter your password';
      default:
        return '';
    }
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = event.target;
    if (name === 'email') {
      setEmail(value);
    } else if (name === 'password') {
      setPassword(value);
    }
    setErrors({
      ...errors,
      [name]: validateField(name, value),
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>): Promise<void> => {
    event.preventDefault();
  
    const newErrors: Errors = {
      email: validateField('email', email),
      password: validateField('password', password),
    };
  
    setErrors(newErrors);
  
    // If there are validation errors, return early
    if (Object.values(newErrors).some((error) => error)) {
      return;
    }
  
    setLoading(true);
  
    try {
      // Use the login function from auth.ts and pass the appropriate path
      const result = await login(email, password, 'applicants/login');
  
      if (result.success) {
        // Store the access token and clear form fields and errors
        localStorage.setItem('accessToken', result.accessToken!);
        setEmail('');
        setPassword('');
        setErrors({});
        setLoginStatus({ message: result.message, success: true });
  
        // Optionally, delay navigation to let user see the success message
        setTimeout(() => {
          navigate('/applicant');
        }, 1000); // Adjust the delay as needed
      } else {
        // Display the error message from the login attempt
        setLoginStatus({ message: result.message, success: false });
      }
    } catch (error) {
      setLoginStatus({ message: 'An unexpected error occurred. Please try again later', success: false });
      console.error('Unexpected error during login:', error);error
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          mt: 6
        }}
      >
        <Container component="main" maxWidth="md" sx={{ width: '83%' }}>
          <Box
            bgcolor="#ffffff"
            py={4}
            px={6}
            pb={6}
            borderRadius={3}
            display="flex"
            flexDirection="column"
            alignItems="center"
            boxShadow={16}
            sx={{
              animation: 'fadeIn 0.5s ease-in-out',
              borderRadius: 2,
              width: '100%',
            }}
          >
            <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
              <SchoolIcon />
            </Avatar>
            <Typography component="h1" variant="h5">
              School Admission Login
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ mt: 1, textAlign: 'center' }}>
              Access your application status or manage your admission process.
            </Typography>
            {loginStatus && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mt: 2,
                  p: 1.5,
                  borderRadius: 1,
                  backgroundColor: loginStatus.success ? '#eafaf1' : '#fdecea',
                  color: loginStatus.success ? '#2e7d32' : '#d32f2f',
                  width: '100%',
                }}
              >
                {loginStatus.success ? <CheckCircleIcon /> : <ErrorIcon />}
                <Typography variant="body2" ml={1}>
                  {loginStatus.message}
                </Typography>
              </Box>
            )}
            <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, width: '100%' }}>
              <TextField
                margin="dense"
                fullWidth
                id="email"
                label="Email Address"
                name="email"
                autoComplete="email"
                autoFocus
                value={email}
                onChange={handleInputChange}
                error={!!errors.email}
                helperText={errors.email}
                variant="outlined"
              />
              <TextField
                margin="dense"
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={password}
                onChange={handleInputChange}
                error={!!errors.password}
                helperText={errors.password}
                variant="outlined"
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={(theme) => ({
                  mt: 2,
                  mb: 2,
                  py: 1.2,
                  background: `linear-gradient(90deg, ${theme.palette.primary.main}, ${theme.palette.primary.light})`,
                  boxShadow: '0px 2px 4px rgba(0, 0, 0, 0.1)',
                  '&:hover': {
                    background: `linear-gradient(90deg, ${theme.palette.primary.dark}, ${theme.palette.primary.main})`,
                  },
                })}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
              <Box display="flex" justifyContent="center" mt={2}>
                <Typography variant="body2" color="textSecondary">
                  New applicant?{' '}
                  <Link href="/register" variant="body2">
                    Apply now
                  </Link>
                </Typography>
              </Box>
            </Box>
          </Box>
        </Container>
      </Box>
    </ThemeProvider>
  );
}
