import { useEffect, useState } from 'react';
import {
  Box,
  Button,
  Typography,
  MenuItem,
  FormControl,
  InputLabel,
  Select,
  CircularProgress,
  Paper,
  Divider,
  Stack,
} from '@mui/material';
import { UploadFile as UploadFileIcon } from '@mui/icons-material';
import apiClient, { refreshToken } from '../../utils/auth';
import { formatStatus, getStatusColor } from '../../utils/stringUtils';

type Course = {
  course_id: number;
  course_name: string;
};

type ExistingApplication = {
  application_id: number;
  application_status: string;
  course_name: string;
  application_date: string;
};

export default function SubmitApplication() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [documentOne, setDocumentOne] = useState<File | null>(null);
  const [documentTwo, setDocumentTwo] = useState<File | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const [existingApplication, setExistingApplication] = useState<ExistingApplication | null>(null);
  const [loadingApplicationCheck, setLoadingApplicationCheck] = useState<boolean>(false);

  useEffect(() => {
    setLoading(true);

    const fetchCourses = async () => {
      try {
        const response = await apiClient.get('/courses');
        setCourses(response.data.courses);
      } catch (error: any) {
        if (error.response?.status === 403) {
          const refreshed = await refreshToken();
          if (refreshed) {
            fetchCourses();
          } else {
            window.location.reload();
          }
        } else {
          setError('Error fetching courses.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchCourses();
  }, []);

  useEffect(() => {
    setLoadingApplicationCheck(true);

    const checkExistingApplication = async () => {
      try {
        const response = await apiClient.get('/applications/check');
        if (response.data.exists) {
          setExistingApplication(response.data.application);
        }
      } catch (error: any) {
        if (error.response?.status === 403) {
          const refreshed = await refreshToken();
          if (refreshed) {
            checkExistingApplication();
          } else {
            window.location.reload();
          }
        } else {
          setError('Error checking existing application.');
        }
      } finally {
        setLoadingApplicationCheck(false);
      }
    };

    checkExistingApplication();
  }, []);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedCourse || !documentOne || !documentTwo) {
      setError('Please fill out all required fields.');
      return;
    }

    try {
      setError(null);
      setSuccess(false);
      setLoading(true);

      const formData = new FormData();
      formData.append('course_id', selectedCourse.toString());
      formData.append('documentOne', documentOne);
      formData.append('documentTwo', documentTwo);

      await apiClient.post('/applications/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      setLoading(false);
      setSuccess(true);
    } catch (error: any) {
      if (error.response?.status === 403) {
        const refreshed = await refreshToken();
        if (refreshed) {
          
        } else {
          window.location.reload();
        }
      }
      setLoading(false);
      setError('Error submitting application.');
    }
  };

  const handleCourseChange = (event: any) => {
    setSelectedCourse(event.target.value);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>, setFile: React.Dispatch<React.SetStateAction<File | null>>) => {
    if (event.target.files && event.target.files[0]) {
      setFile(event.target.files[0]);
    }
  };

  const isFormValid = selectedCourse !== null && documentOne !== null && documentTwo !== null;

  return (
    <>
      {loadingApplicationCheck ? (
        <CircularProgress sx={{ display: 'block', mx: 'auto', mb: 2 }} />
      ) : existingApplication ? (
        <Paper elevation={6} sx={{ maxWidth: 560, mx: 'auto', p: 4, mt: 5, backgroundColor: '#f9fafb', borderRadius: 4 }}>
          <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
            You have already submitted an application.
          </Typography>
          <Typography variant="body1" align="center" sx={{ mt: 2 }}>
            Your application status is:{" "}
            <Typography
              component="span"
              sx={{
                color: getStatusColor(existingApplication.application_status),
                fontWeight: 'bold',
              }}
            >
              {formatStatus(existingApplication.application_status as '' | 'Passed' | 'NotPassed' | 'NoShow')}
            </Typography>
            .
          </Typography>

          <Typography variant="body1" align="center" sx={{ mt: 2 }}>
            Course Name: <strong>{existingApplication.course_name}</strong>
          </Typography>
          <Typography variant="body1" align="center" sx={{ mt: 2 }}>
            Application Date: <strong>{new Date(existingApplication.application_date).toLocaleDateString()}</strong>
          </Typography>
          <Typography variant="body2" align="center" sx={{ mt: 1, color: 'text.secondary' }}>
            If you need to make any changes, please contact support.
          </Typography>
        </Paper>
      ) : success ? (
        <Paper elevation={6} sx={{ maxWidth: 560, mx: 'auto', p: 4, mt: 5, backgroundColor: '#f9fafb', borderRadius: 4 }}>
          <Typography variant="h5" component="h1" align="center" gutterBottom sx={{ fontWeight: 'bold', color: 'success.main' }}>
            Application Submitted Successfully!
          </Typography>
          <Typography variant="body1" align="center" sx={{ mt: 2 }}>
            Your application has been submitted. Please wait while it is being processed, and you will be notified upon completion.
          </Typography>
        </Paper>
      ) : (
        <Paper elevation={6} sx={{ maxWidth: 500, mx: 'auto', p: 4, mt: 5, backgroundColor: '#f9fafb', borderRadius: 4 }}>
          <Box component="form" onSubmit={handleSubmit}>
            <Typography
              variant="h4"
              component="h1"
              align="center"
              gutterBottom
              sx={{ fontWeight: 'bold', color: 'primary.main', mb: 3 }}
            >
              Submit Your Application
            </Typography>

            <Divider sx={{ mb: 4 }} />

            {loading && <CircularProgress sx={{ display: 'block', mx: 'auto', mb: 2 }} />}
            {error && (
              <Typography color="error" sx={{ mb: 2 }} align="center">
                {error}
              </Typography>
            )}

            <FormControl fullWidth sx={{ mb: 3 }}>
              <InputLabel id="course-select-label">Select Course</InputLabel>
              <Select
                labelId="course-select-label"
                value={selectedCourse || ''}
                onChange={handleCourseChange}
                label="Select Course"
                required
              >
                {courses.map((course) => (
                  <MenuItem key={course.course_id} value={course.course_id}>
                    {course.course_name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <Stack spacing={3} direction="column" sx={{ mb: 3 }}>
              <Box>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  sx={{
                    width: '100%',
                    backgroundColor: '#1976d2',
                    ':hover': { backgroundColor: '#1565c0' },
                    py: 1.5,
                  }}
                >
                  Upload Document One
                  <input type="file" hidden onChange={(e) => handleFileChange(e, setDocumentOne)} required />
                </Button>
                {documentOne && <Typography variant="body2" mt={1}>{documentOne.name}</Typography>}
              </Box>

              <Box>
                <Button
                  variant="contained"
                  component="label"
                  startIcon={<UploadFileIcon />}
                  sx={{
                    width: '100%',
                    backgroundColor: '#1976d2',
                    ':hover': { backgroundColor: '#1565c0' },
                    py: 1.5,
                  }}
                >
                  Upload Document Two
                  <input type="file" hidden onChange={(e) => handleFileChange(e, setDocumentTwo)} required />
                </Button>
                {documentTwo && <Typography variant="body2" mt={1}>{documentTwo.name}</Typography>}
              </Box>
            </Stack>

            <Divider sx={{ mb: 3 }} />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              fullWidth
              disabled={!isFormValid || loading}
              sx={{ py: 1.5, fontWeight: 'bold', textTransform: 'none', backgroundColor: 'primary.main', ':hover': { backgroundColor: 'primary.dark' } }}
            >
              Submit Application
            </Button>
          </Box>
        </Paper>
      )}
    </>
  );
}
