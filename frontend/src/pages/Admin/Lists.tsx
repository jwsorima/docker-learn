import CurrentAcademicYear from "../../components/CurrentAcademicYear";

import React, { useEffect, useState } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Checkbox,
  ToggleButton,
  ToggleButtonGroup,
  Button,
  useTheme,
  Box,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
  TablePagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
} from '@mui/material';
import axios from "axios";
import { getListStatusColor } from "../../utils/stringUtils";
import AdmissionRecordsTable from "../../components/AdmissionRecordsTable";

type Application = {
  application_id: number;
  full_name: string;
};

type Course = {
  course_name: string;
  slots: number | null;
  course_status_id: number;
};

const formatStatus = (status: '' | 'Passed' | 'NotPassed' | 'NoShow'): string => {
  switch (status) {
    case 'Passed':
      return 'Passed';
    case 'NotPassed':
      return 'Not Passed';
    case 'NoShow':
      return 'No Show';
    default:
      return status;
  }
};

export function ApplicationStatusTable() {
  const theme = useTheme();

  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [generateListError, setGenerateListError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [totalApplications, setTotalApplications] = useState<number>(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [selectedStatus, setSelectedStatus] = useState<'' | 'Passed' | 'NotPassed' | 'NoShow'>('');
  const [selectedApplicants, setSelectedApplicants] = useState<number[]>([]);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const handleStatusChange = (
    _event: React.MouseEvent<HTMLElement>,
    newStatus: 'Passed' | 'NotPassed' | 'NoShow'
  ) => {
    if (newStatus) {
      setSelectedStatus(newStatus);
    }
  };

  const handleCourseChange = (event: any) => {
    const selectedCourseId = event.target.value;
    setSelectedCourse(selectedCourseId);
  };

  const handleCheckboxChange = (applicationId: number) => {
    setSelectedApplicants((prevSelected) =>
      prevSelected.includes(applicationId)
        ? prevSelected.filter((id) => id !== applicationId)
        : [...prevSelected, applicationId]
    );
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleDialogOpen = () => {
    setDialogOpen(true);
  };

  const handleDialogClose = (confirmed: boolean) => {
    if (confirmed) {
      generateList();
    }
    setDialogOpen(false);
  };

  const generateList = async () => {
    const selectedApplicationIds = applications
      .filter((app) => selectedApplicants.includes(app.application_id))
      .map((app) => app.application_id);
  
    try {
      await axios.post(`http://localhost:3000/applications/course/${selectedCourse}/list`, {
        application_ids: selectedApplicationIds,
        status: selectedStatus,
      });
  
      setSelectedApplicants([]);
  
      await fetchApplications();

      setGenerateListError(null)
    } catch (error) {
      console.error('Error generating list:', error);
      setGenerateListError('An error occurred while generating the list. Please try again.');
    }
  };

  const fetchApplications = async () => {
    if (selectedCourse !== null) {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/applications/course/${selectedCourse}/active`, {
          params: {
            page: page,
            limit: rowsPerPage,
            status: 'Scheduled'
          },
        });

        setApplications(response.data.applications);
        setTotalApplications(parseInt(response.data.total, 10));
        
      } catch (error) {
        setError('Error fetching applications.');
      } finally {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const coursesResponse = await axios.get('http://localhost:3000/courses/active');
        setCourses(coursesResponse.data.courses);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        setError('Error fetching initial data.');
      }
    };
  
    fetchInitialData();
  }, []);

  useEffect(() => {
    const loadApplications = async () => {
      await fetchApplications();
    };

    loadApplications();
  }, [selectedCourse, page, rowsPerPage]);

  return <>
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 8, maxWidth: { xs: 400, sm: 612, lg: 940, xl: 1260 } }}>
        <Table aria-label="applicants table" sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell colSpan={3}>
                <FormControl fullWidth sx={{ maxWidth: 300 }}>
                  <InputLabel id="course-select-label">Select Course</InputLabel>
                  <Select
                    labelId="course-select-label"
                    value={selectedCourse || ''}
                    onChange={handleCourseChange}
                    label="Select Course"
                  >
                    {courses.map((course) => (
                      <MenuItem key={course.course_status_id} value={course.course_status_id}>
                        {course.course_name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3}>
                <Box
                  sx={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    width: '100%',
                  }}
                >
                  <Box sx={{ width: '10%', textAlign: 'center' }}>
                    Select
                  </Box>
                  <Box sx={{ width: '15%', minWidth: '40px', textAlign: 'center' }}>
                    Application ID
                  </Box>
                  <Box sx={{ flexGrow: 1, textAlign: 'left', ml: 1 }}>
                    Applicant Name
                  </Box>
                </Box>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  <Typography color="error">{error}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              applications.length > 0 ? (
                applications.map((application) => (
                  <TableRow key={application.application_id}>
                    <TableCell colSpan={3} sx={{ padding: '8px' }}>
                      <Box
                        sx={{
                          display: 'flex',
                          flexDirection: 'row',
                          alignItems: 'center',
                          width: '100%',
                        }}
                      >
                        <Box
                          sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: '10%',
                          }}
                        >
                          <Checkbox
                            checked={selectedApplicants.includes(application.application_id)}
                            onChange={() => handleCheckboxChange(application.application_id)}
                          />
                        </Box>
                        <Box
                          sx={{
                            width: '15%',
                            minWidth: '40px',
                            wordBreak: 'break-word',
                            textAlign: 'center',
                          }}
                        >
                          {application.application_id}
                        </Box>
                        <Box
                          sx={{
                            flexGrow: 1,
                            minWidth: '100px',
                            wordBreak: 'break-word',
                            paddingLeft: 1,
                          }}
                        >
                          {application.full_name}
                        </Box>
                      </Box>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No applications found for this course.
                  </TableCell>
                </TableRow>
              )
            )}
            
          </TableBody>
        </Table>
      </TableContainer>
      
      <TablePagination
        component="div"
        count={totalApplications}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <Box>
        <ToggleButtonGroup
          value={selectedStatus}
          exclusive
          onChange={handleStatusChange}
          aria-label="application status"
          sx={{ mb: 2, mt: 4 }}
        >
          <ToggleButton
            value="Passed"
            aria-label="Passed"
            sx={{
              backgroundColor: 'white',
              color: 'black',
              border: `1px solid ${theme.palette.primary.light}`,
              borderRadius: '4px',
              fontSize: {
                xs: '0.8rem',
                sm: '1rem',
                md: '1.2rem',
              },
              padding: {
                xs: '8px 16px',
                sm: '10px 20px',
                md: '12px 24px',
              },
              '&:not(:first-of-type)': {
                borderLeft: `1px solid ${theme.palette.primary.light}`,
              },
              '&.Mui-selected': {
                backgroundColor: theme.palette.success.main,
                color: '#fff',
                borderColor: theme.palette.success.main,
              },
              '&.Mui-selected:hover': {
                backgroundColor: theme.palette.success.dark,
              },
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            Passed
          </ToggleButton>
          <ToggleButton
            value="NotPassed"
            aria-label="Not Passed"
            sx={{
              backgroundColor: 'white',
              color: 'black',
              border: `1px solid ${theme.palette.primary.light}`,
              borderRadius: '4px',
              fontSize: {
                xs: '0.8rem',
                sm: '1rem',
                md: '1.2rem',
              },
              padding: {
                xs: '8px 16px',
                sm: '10px 20px',
                md: '12px 24px',
              },
              '&:not(:first-of-type)': {
                borderLeft: `1px solid ${theme.palette.primary.light}`,
              },
              '&.Mui-selected': {
                backgroundColor: theme.palette.error.main,
                color: '#fff',
                borderColor: theme.palette.error.main,
              },
              '&.Mui-selected:hover': {
                backgroundColor: theme.palette.error.dark,
              },
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            Not Passed
          </ToggleButton>
          <ToggleButton
            value="NoShow"
            aria-label="No Show"
            sx={{
              backgroundColor: 'white',
              color: 'black',
              border: `1px solid ${theme.palette.primary.light}`,
              borderRadius: '4px',
              fontSize: {
                xs: '0.8rem',
                sm: '1rem',
                md: '1.2rem',
              },
              padding: {
                xs: '8px 16px',
                sm: '10px 20px',
                md: '12px 24px',
              },
              '&:not(:first-of-type)': {
                borderLeft: `1px solid ${theme.palette.primary.light}`,
              },
              '&.Mui-selected': {
                backgroundColor: theme.palette.text.secondary,
                color: '#fff',
                borderColor: '#616161',
              },
              '&.Mui-selected:hover': {
                backgroundColor: '#616161',
              },
              '&:hover': {
                backgroundColor: '#f0f0f0',
              },
            }}
          >
            No Show
          </ToggleButton>
        </ToggleButtonGroup>
      </Box>
    </Box>
    
    <Button
      variant="contained"
      color="primary"
      size="large"
      onClick={handleDialogOpen}
      disabled={selectedApplicants.length === 0 || !selectedStatus}
      sx={{ mt: 2 }}
    >
      Generate List
    </Button>

    {generateListError && (
        <Typography
          variant="body2"
          color="error"
          sx={{ mt: 2 }}
        >
          {generateListError}
        </Typography>
      )}

    <Dialog open={dialogOpen} onClose={() => handleDialogClose(false)}>
      <DialogTitle>Confirm Action</DialogTitle>
      <DialogContent>
        <DialogContentText>
          You have selected <span style={{ fontWeight: 'bold', color: 'black' }}>{selectedApplicants.length}</span> applicant(s). Do you want to proceed with updating their status to "<span style={{ color: getListStatusColor(theme, selectedStatus), fontWeight: 'bold' }}>{formatStatus(selectedStatus)}</span>"?
        </DialogContentText>
      </DialogContent>
      <DialogActions>
        <Button onClick={() => handleDialogClose(false)} color="error">
          Cancel
        </Button>
        <Button onClick={() => handleDialogClose(true)} color="primary" variant="contained" autoFocus>
          Confirm
        </Button>
      </DialogActions>
    </Dialog>
  </>
};


export default function Lists() {
  return <>
    <CurrentAcademicYear />

    <ApplicationStatusTable />
    
    <div style={{ paddingBottom: '32px' }}></div>
    
    <AdmissionRecordsTable />
  </>
}