import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  CssBaseline,
  Button,
  Divider,
} from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import { useNavigate } from 'react-router-dom';
import apiClient, { refreshToken } from '../../utils/auth';
import { ApplicationStatus } from './ApplicationStatus';
import { formatStatus, getStatusColor } from '../../utils/stringUtils';

type ApplicantDetails = {
  full_name: string;
  address: string;
  contact_number: string;
  sex: string;
  birthdate: string;
  email: string;
}

export type AuthPayload = { 
  id: number,
  email: string,
  role: 'applicant',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [applicant, setApplicant] = useState<ApplicantDetails | null>(null);
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplicantDetails = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found');
        }

        const decoded = jwtDecode<AuthPayload>(token);
        const applicantId = decoded.id;

        const response = await apiClient.get(`/applicants/${applicantId}`);
        setApplicant(response.data);
        const applicationStatus = await apiClient.get('/applications/status')
        setStatus(applicationStatus.data)

        setLoading(false);
      } catch (error: any) {
        if (error.response?.status === 403) {
          const refreshed = await refreshToken();
          if (refreshed) {
            fetchApplicantDetails();
          } else {
            setError('Session expired. Please log in again.');
            navigate('/login');
          }
        } else if(error.response?.status === 404) {
          setLoading(false);
        } else {
          setError('Failed to load applicant details. Please try again later.');
          setLoading(false);
        }
      }
    };

    fetchApplicantDetails();
  }, [navigate]);

  if (loading) {
    return (
      <Box sx={{ pb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: '#ffffff',
            padding: 4,
            borderRadius: 2,
            boxShadow: 16,
          }}
        >
          <CircularProgress />
        </Box>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ pb: 4 }}>
        <Box
          sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            bgcolor: '#ffffff',
            padding: 4,
            borderRadius: 2,
            boxShadow: 16,
          }}
        >
          <Typography color="error">{error}</Typography>
        </Box>
    </Box>
    );
  }

  return <>
    <CssBaseline />
    <Box sx={{ pb: 4 }}>
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          bgcolor: '#ffffff',
          padding: 6,
          borderRadius: 2,
          boxShadow: 16,
          maxWidth: 900,
          margin: '0 auto',
        }}
      >
        <Typography component="h1" variant="h4" sx={{ fontWeight: 'bold', mt: 2, px: 2, py: 1, borderRadius: 1 }}>
          Welcome, {applicant?.full_name || 'Applicant'}!
        </Typography>

        <Typography variant="h6" sx={{ mt: 2, color: 'text.primary' }}>
          {status ? (
            <>
              Your application status is:{" "}
              <Typography
                component="span"
                sx={{ color: getStatusColor(status.application_status), fontWeight: 'bold' }}
              >
                {formatStatus(status.application_status as '' | 'Passed' | 'NotPassed' | 'NoShow')}
              </Typography>
            </>
          ) : (
            'Application status not available.'
          )}
        </Typography>




        <Box sx={{ mt: 3, width: '100%' }}>
          <Typography variant="body2" sx={{ mb: 2, textAlign: 'center' }}>
            Here's a quick overview of your application details:
          </Typography>
          <Box sx={{ mt: 2, gap: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={() => navigate('/applicant/status')}
              sx={{ flex: 1 }}
            >
              View Application Status
            </Button>
          </Box>
        </Box>
        {applicant && (
          <Box sx={{ mt: 4, width: '100%' }}>
            <Divider sx={{ my: 2 }} />
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Full Name:</strong> {applicant.full_name}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Address:</strong> {applicant.address}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Contact Number:</strong> {applicant.contact_number}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Sex:</strong> {applicant.sex}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Birthdate:</strong> {new Date(applicant.birthdate).toLocaleDateString()}
            </Typography>
            <Typography variant="body1" sx={{ mb: 1 }}>
              <strong>Email:</strong> {applicant.email}
            </Typography>
            <Divider sx={{ my: 2 }} />
          </Box>
        )}
      </Box>
    </Box>
  </>
}
