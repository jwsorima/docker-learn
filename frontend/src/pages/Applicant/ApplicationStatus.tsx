import { useEffect, useState } from 'react';
import {
  Box,
  Typography,
  CircularProgress,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import apiClient, { refreshToken } from '../../utils/auth';
import { formatStatus, getStatusColor } from '../../utils/stringUtils';

export type ApplicationStatus = {
  application_status: string;
  application_date: string;
  course_name: string;
  schedule_start: string | null;
  schedule_end: string | null;
  remarks: string | null;
  academic_year: string;
};

export default function ApplicationStatus() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<ApplicationStatus | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApplicationStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (!token) {
          throw new Error('No access token found');
        }

        const response = await apiClient.get('/applications/status');
        setStatus(response.data);
        setLoading(false);
      } catch (error: any) {
        if (error.response?.status === 403) {
          const refreshed = await refreshToken();
          if (refreshed) {
            fetchApplicationStatus();
          } else {
            navigate('/login');
          }
        } else if (error.response?.status === 404) {
          setStatus(null);
          setError(null);
          setLoading(false);
        } else {
          setError('Failed to load application status. Please try again later.');
          setLoading(false);
        }
      }
    };

    fetchApplicationStatus();
  }, [navigate]);

  return (
    <Paper elevation={6} sx={{ padding: 4, maxWidth: 600, mx: 'auto', mt: 5 }}>
      <Typography variant="h4" component="h1" gutterBottom align="center" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
        Your Application Status
      </Typography>
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress />
        </Box>
      ) : error ? (
        <Box sx={{ py: 6, textAlign: 'center' }}>
          <Typography color="error">{error}</Typography>
        </Box>
      ) : status ? (
        <Stack spacing={2}>
          <Divider />
          <Typography variant="h6">
            <strong>Status: </strong>
            <Typography
              component="span"
              sx={{ color: getStatusColor(status.application_status), fontWeight: 'bold' }}
            >
              {formatStatus(status.application_status as '' | 'Passed' | 'NotPassed' | 'NoShow')}
            </Typography>
          </Typography>
          <Typography variant="body1">
            <strong>Course:</strong> {status.course_name || 'Not Available'}
          </Typography>
          <Typography variant="body1">
            <strong>Academic Year:</strong> {status.academic_year || 'Not Available'}
          </Typography>
          <Typography variant="body1">
            <strong>Application Date:</strong>{' '}
            {new Date(status.application_date).toLocaleDateString()}
          </Typography>
          <Typography variant="body1">
            <strong>Schedule Start:</strong>{' '}
            {status.schedule_start ? new Date(status.schedule_start).toLocaleString() : 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Schedule End:</strong>{' '}
            {status.schedule_end ? new Date(status.schedule_end).toLocaleString() : 'N/A'}
          </Typography>
          <Typography variant="body1">
            <strong>Remarks:</strong> {status.remarks || 'No remarks available'}
          </Typography>
          <Divider />
        </Stack>
      ) : (
        <Typography variant="body1" align="center" sx={{ mt: 2 }}>
          No application status available.
        </Typography>
      )}
    </Paper>
  );
}
