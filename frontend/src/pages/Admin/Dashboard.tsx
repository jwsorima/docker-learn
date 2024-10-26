import { useState, useEffect } from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText } from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import Grid from '@mui/material/Grid2';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getStatusColor } from '../../utils/stringUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

type RecentApplication = {
  application_id: number;
  full_name: string;
  course_name: string;
  application_status: string;
};

type AvailableCourse = {
  course_status_id: number;
  course_name: string;
  year_range: string;
  slots: number;
};

type AdmissionList = {
  admission_record_id: number;
  course_name: string;
  type: string;
  created_at: string;
};

type DashboardStats = {
  total_applicants: number;
  active_courses: number;
  total_admissions: number;
  total_staff: number;
  recent_applications: RecentApplication[];
  available_courses: AvailableCourse[];
  admission_lists: AdmissionList[];
};

export default function AdminDashboard() {
  const [stats, setStats] = useState<DashboardStats>({
    total_applicants: 0,
    active_courses: 0,
    total_admissions: 0,
    total_staff: 0,
    recent_applications: [],
    available_courses: [],
    admission_lists: [],
  });

  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('http://localhost:3000/staffs/stats');
      setStats(response.data);
      setError(false);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError(true);
    }
  };

  return (
    <Box sx={{ flexGrow: 1 }}>
        <Typography 
          variant="h4" 
          sx={{ mb: 3, color: 'primary.main', textAlign: 'center', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}
        >
          <DashboardIcon sx={{ fontSize: '1.5em' }} />
          Admin Dashboard
        </Typography>

      {error ? (
        <Typography variant="h6" color="error" align="center">
          Failed to fetch data. Please try again later.
        </Typography>
      ) : (
        <Grid container spacing={3} columns={12}>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: 'text.secondary' }}>
                Total Applicants
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats.total_applicants}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: 'text.secondary' }}>
                Active Courses
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats.active_courses}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: 'text.secondary' }}>
                Total Admissions
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats.total_admissions}
              </Typography>
            </Paper>
          </Grid>
          <Grid size={{ xs: 12, sm: 6, md: 3 }}>
            <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
              <Typography variant="h6" gutterBottom sx={{ fontWeight: 500, color: 'text.secondary' }}>
                Total Staff
              </Typography>
              <Typography variant="h3" sx={{ fontWeight: 700 }}>
                {stats.total_staff}
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Recent Applications
              </Typography>
              <List>
                {stats.recent_applications.map((app: RecentApplication) => (
                  <ListItem key={app.application_id}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
                          {app.full_name}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span" sx={{ display: 'inline' }}>
                            Course: {app.course_name} | Status: 
                          </Typography>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ color: getStatusColor(app.application_status), fontWeight: 'bold', ml: 0.5 }}
                          >
                            {app.application_status}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Available Courses
              </Typography>
              <List>
                {stats.available_courses.map((course: AvailableCourse) => (
                  <ListItem key={course.course_status_id}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          {course.course_name} ({course.year_range})
                        </Typography>
                      }
                      secondary={`Available Slots: ${course.slots}`}
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>

          <Grid size={12}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
                Admission Lists
              </Typography>
              <List>
                {stats.admission_lists.map((admission: AdmissionList) => (
                  <ListItem key={admission.admission_record_id}>
                    <ListItemText
                      primary={
                        <Typography variant="subtitle1" sx={{ fontWeight: 500 }}>
                          Course: {admission.course_name}
                        </Typography>
                      }
                      secondary={
                        <>
                          <Typography variant="body2" component="span">
                            Type: 
                          </Typography>
                          <Typography
                            variant="body2"
                            component="span"
                            sx={{ color: getStatusColor(admission.type), fontWeight: 'bold', ml: 0.5 }}
                          >
                            {admission.type}
                          </Typography>
                          <Typography variant="body2" component="span" sx={{ ml: 1 }}>
                            | Date: {dayjs(admission.created_at).tz("Asia/Manila").format("YYYY-MM-DD HH:mm:ss")}
                          </Typography>
                        </>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
        </Grid>
      )}
    </Box>
  );
}
