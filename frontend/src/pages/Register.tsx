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
  CircularProgress,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormHelperText,
  SelectChangeEvent,
  InputAdornment,
  Snackbar,
  Alert,
} from '@mui/material';
import Grid from '@mui/material/Grid2';
import SchoolIcon from '@mui/icons-material/School';
import { useTheme } from '@mui/material/styles';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFnsV3'
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DatePicker } from '@mui/x-date-pickers';

export type Applicant = {
  fullName: string;
  address: string;
  contactNumber: string;
  sex: string;
  birthdate: Date | null;
  email: string;
  password: string;
};

export type ApplicantErrors = {
  [K in keyof Applicant]?: string;
};

export default function Register() {
  const theme = useTheme();
  const navigate = useNavigate();

  const [applicant, setApplicant] = useState<Applicant>({
    fullName: '',
    address: '',
    contactNumber: '',
    sex: '',
    birthdate: null,
    email: '',
    password: '',
  });

  const [loading, setLoading] = useState<boolean>(false);
  const [errors, setErrors] = useState<ApplicantErrors>({});
  const [registrationStatus, setRegistrationStatus] = useState<{ message: string; success: boolean } | null>(null);
  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [confirmPasswordError, setConfirmPasswordError] = useState<string>('');

  const validateField = (name: keyof Applicant, value: string | Date | null): string => {
    const fieldLabels: { [key in keyof Applicant]: string } = {
      fullName: 'Full Name',
      address: 'Address',
      contactNumber: 'Contact Number',
      sex: 'Sex',
      birthdate: 'Birthdate',
      email: 'Email',
      password: 'Password',
    };
    return value ? '' : `${fieldLabels[name]} is required`;
  };

  const handleInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof Applicant;

    if (name === 'confirmPassword') {
      setConfirmPassword(value);
  
      // Check if password and confirm password match
      if (value !== applicant.password) {
        setConfirmPasswordError('Passwords do not match');
      } else {
        setConfirmPasswordError('');
      }
      return;
    }
  
    switch (fieldName) {
      case 'contactNumber':

        setErrors((prev) => ({
          ...prev,
          contactNumber: '',
        }));

        if (applicant.contactNumber.length > value.length && (value.length === 3 || value.length === 7)) {
          setApplicant((prev) => ({
            ...prev,
            contactNumber: value.slice(0, -1),
          }));
          return;
        }
  
        if (!/^9/.test(value)) {
          setApplicant((prev) => ({
            ...prev,
            contactNumber: '',
          }));
          return;
        }
  
        if (/[^0-9 ]/.test(value)) {
          return;
        }
  
        if (value.length === 3 || value.length === 7) {
          setApplicant((prev) => ({
            ...prev,
            contactNumber: value.concat(' '),
          }));
          return;
        }

        setApplicant((prev) => ({
          ...prev,
          contactNumber: value,
        }));
        return;
  
      default:
        setApplicant((prev) => ({ ...prev, [fieldName]: value }));
  
        setErrors((prev) => ({
          ...prev,
          [fieldName]: validateField(fieldName, value),
        }));
        break;
    }
  };

  const handleSelectChange = (event: SelectChangeEvent<string>) => {
    const { name, value } = event.target;
    const fieldName = name as keyof Applicant;
  
    setApplicant((prev) => ({ ...prev, [fieldName]: value }));
  
    setErrors((prev) => ({
      ...prev,
      [fieldName]: validateField(fieldName, value),
    }));
  };

  const handleDateChange = (newDate: Date | null) => {
    setApplicant({ ...applicant, birthdate: newDate });
  };

  const validateFields = (): ApplicantErrors => {
    const newErrors: ApplicantErrors = {};
    Object.entries(applicant).forEach(([key, value]) => {
      const fieldName = key as keyof Applicant;
      newErrors[fieldName] = validateField(fieldName, value);
    });

    if (applicant.password !== confirmPassword) {
      setConfirmPasswordError('Passwords do not match');
      newErrors.password = 'Passwords do not match';
    } else {
      setConfirmPasswordError('');
    }

    return newErrors;
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newErrors = validateFields();
    setErrors(newErrors);

    // Check if there are any errors before proceeding
    if (Object.values(newErrors).some((error) => error) || confirmPasswordError) {
      return;
    }

    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_BE_DOMAIN_NAME}/applicants`, applicant);
      setRegistrationStatus({ message: 'Registration successful!', success: true });

      setSnackbarMessage('Registration successful!');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);

      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message === 'An account with this email already exists.') {
          setSnackbarMessage('An account with this email already exists.');
          setSnackbarSeverity('error');
          setRegistrationStatus({ message: 'An account with this email already exists.', success: false });
        } else {
          setSnackbarMessage('Registration failed. Please try again.');
          setSnackbarSeverity('error');
          setRegistrationStatus({ message: 'Registration failed. Please try again.', success: false });
        }
      } else {
        setSnackbarMessage('An unexpected error occurred');
        setSnackbarSeverity('error');
        setRegistrationStatus({ message: 'An unexpected error occurred', success: false });
      }
      setSnackbarOpen(true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container component="main" maxWidth="md">
        <Box
          sx={{
            marginTop: 4,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: '#ffffff',
            padding: 4,
            borderRadius: 2,
            boxShadow: 16,
          }}
        >
          <Avatar sx={{ m: 1, bgcolor: 'primary.main' }}>
            <SchoolIcon />
          </Avatar>
          <Typography component="h1" variant="h5">
            Register for Admission
          </Typography>
          <Box component="form" onSubmit={handleSubmit} sx={{ mt: 2, width: '100%' }}>
            {registrationStatus && (
              <Typography
                variant="body2"
                color={registrationStatus.success ? 'success.main' : 'error.main'}
                align="center"
                sx={{ mb: 2 }}
              >
                {registrationStatus.message}
              </Typography>
            )}
            <Grid container spacing={2}>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  id="fullName"
                  label="Full Name"
                  name="fullName"
                  value={applicant.fullName}
                  onChange={handleInputChange}
                  error={!!errors.fullName}
                  helperText={errors.fullName}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <TextField
                  fullWidth
                  id="contactNumber"
                  label="Contact Number"
                  inputMode="numeric"
                  slotProps={{
                    htmlInput: {
                      maxLength: 12,
                      inputMode: "numeric",
                    },
                    input: {
                      startAdornment: (
                        <InputAdornment position="start" sx={{mt: { xs: 0, md: -0.2, lg: -0.1, xl: 0 }}}>
                          <Typography>+63</Typography>
                        </InputAdornment>
                      ),
                    }
                  }}
                  name="contactNumber"
                  value={applicant.contactNumber}
                  onChange={handleInputChange}
                  error={!!errors.contactNumber}
                  helperText={errors.contactNumber}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="address"
                  label="Address"
                  name="address"
                  value={applicant.address}
                  onChange={handleInputChange}
                  error={!!errors.address}
                  helperText={errors.address}
                />
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <FormControl fullWidth error={!!errors.sex}>
                  <InputLabel id="sex-label">Sex</InputLabel>
                  <Select
                    labelId="sex-label"
                    id="sex"
                    label="Sex"
                    name="sex"
                    value={applicant.sex}
                    onChange={handleSelectChange}
                  >
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                  </Select>
                  <FormHelperText>{errors.sex}</FormHelperText>
                </FormControl>
              </Grid>
              <Grid size={{ xs: 12, sm: 6 }}>
                <LocalizationProvider dateAdapter={AdapterDateFns}>
                  <DatePicker 
                    label="Birthdate"
                    timezone="Asia/Manila"
                    value={applicant.birthdate}
                    onChange={handleDateChange}
                    slotProps={{
                      textField: {
                        fullWidth: true,
                        error: !!errors.birthdate,
                        helperText: errors.birthdate,
                        InputLabelProps: { shrink: true },
                      },
                    }}
                  />
                </LocalizationProvider>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="email"
                  label="Email Address"
                  name="email"
                  type="email"
                  value={applicant.email}
                  onChange={handleInputChange}
                  error={!!errors.email}
                  helperText={errors.email}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="password"
                  label="Password"
                  name="password"
                  type="password"
                  value={applicant.password}
                  onChange={handleInputChange}
                  error={!!errors.password}
                  helperText={errors.password}
                />
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  fullWidth
                  id="confirmPassword"
                  label="Confirm Password"
                  name="confirmPassword"
                  type="password"
                  value={confirmPassword}
                  onChange={handleInputChange}
                  error={!!confirmPasswordError}
                  helperText={confirmPasswordError}
                />
              </Grid>
            </Grid>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Registering...' : 'Register'}
            </Button>
          </Box>
        </Box>

        <Snackbar
          open={snackbarOpen}
          autoHideDuration={6000}
          onClose={() => setSnackbarOpen(false)}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        >
          <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
            {snackbarMessage}
          </Alert>
        </Snackbar>

      </Container>
    </ThemeProvider>
  );
}
