import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  CircularProgress,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  Typography,
  TablePagination,
  Box,
  IconButton,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Button,
  Tooltip,
  Link,
  useTheme
} from '@mui/material';
import { Edit } from '@mui/icons-material';
import SourceIcon from '@mui/icons-material/Source';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { getStatusColor } from '../utils/stringUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

dayjs.tz.setDefault('Asia/Manila');

type Course = {
  course_name: string;
  slots: number | null;
  course_status_id: number;
};

type Application = {
  application_id: number;
  applicant_id: string;
  full_name: string;
  application_status: string;
  application_date: string;
  remarks: string;
  schedule_start?: Dayjs | null;
  schedule_end?: Dayjs | null;
  document_one_ext: string;
  document_two_ext: string;
};

export default function ApplicationsTable() {
  const theme = useTheme();
  const [courses, setCourses] = useState<Course[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedCourseSlots, setSelectedCourseSlots] = useState<number>(0);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [totalApplications, setTotalApplications] = useState<number>(0);

  const [openScheduleDialog, setOpenScheduleDialog] = useState(false);
  const [selectedApplicationId, setSelectedApplicationId] = useState<number | null>(null);
  const [scheduleStart, setScheduleStart] = useState<Dayjs | null>(null);
  const [scheduleEnd, setScheduleEnd] = useState<Dayjs | null>(null);

  const [openRemarksDialog, setOpenRemarksDialog] = useState(false);
  const [remarks, setRemarks] = useState<string>('');

  useEffect(() => {
    axios.get('http://localhost:3000/courses')
      .then((response) => {
        setCourses(response.data.courses);
      })
      .catch(() => {
        setError('Error fetching courses.');
      });
  }, []);

  const fetchApplications = async () => {
    if (selectedCourse !== null) {
      setLoading(true);
      try {
        const response = await axios.get(`http://localhost:3000/applications/course/${selectedCourse}/active`, {
          params: {
            page: page,
            limit: rowsPerPage,
            status: 'Pending'
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
    const loadApplications = async () => {
      await fetchApplications();
    };

    loadApplications();

    (async () => {
      await loadApplications();
    })();
  }, [selectedCourse, page, rowsPerPage]);

  const handleCourseChange = (event: any) => {
    const selectedCourseId = event.target.value;
    setSelectedCourse(selectedCourseId);
    const selectedCourseData = courses.find(course => course.course_status_id === selectedCourseId);
    setSelectedCourseSlots(selectedCourseData?.slots ?? 0);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleScheduleClick = (applicationId: number, scheduleStart: Dayjs | null | undefined, scheduleEnd: Dayjs | null | undefined) => {
    setSelectedApplicationId(applicationId);
    setScheduleStart(scheduleStart ? dayjs(scheduleStart) : null);
    setScheduleEnd(scheduleEnd ? dayjs(scheduleEnd) : null);
    setOpenScheduleDialog(true);
  };

  const handleRemarksClick = (applicationId: number, currentRemarks: string) => {
    setSelectedApplicationId(applicationId);
    setRemarks(currentRemarks);
    setOpenRemarksDialog(true);
  };

  const handleScheduleSubmit = async () => {
    if (!scheduleStart || !scheduleEnd) {
      console.error("Both start and end times must be filled.");
      return;
    }

    try {
      await axios.put(`http://localhost:3000/applications/${selectedApplicationId}/schedule`, {
        schedule_start: scheduleStart,
        schedule_end: scheduleEnd
      });
  
      setOpenScheduleDialog(false);
      await fetchApplications();
    } catch (error) {
      console.error('Error updating schedule:', error);
    }
  };
  

  const handleRemarksSubmit = async () => {
    setOpenRemarksDialog(false);
  
    try {
      await axios.put(`http://localhost:3000/applications/${selectedApplicationId}/remarks`, {
        remarks: remarks,
      });
  
      await fetchApplications(); 
    } catch (error) {
      console.error('Error updating remarks:', error);
    }
  };

  return <>
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 8, maxWidth: { xs: 400, sm: 612, lg: 940, xl: 1260 } }}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell colSpan={7} sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '20px', color: 'primary.main' }}>
                Applications
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={5}>
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
              <TableCell colSpan={2}>
                <Typography variant="body1">Available Slots</Typography>
                <Typography variant="h6" color="primary">
                  {selectedCourseSlots}
                </Typography>
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ width: '10%' }}>#</Box>
                  <Box sx={{ width: '60%' }}>Full Name</Box>
                  <Box sx={{ width: '30%', textAlign: 'center' }}>Status</Box>
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>
                <Box display="flex" flexDirection="column" alignItems="left">
                  <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                    Application Date
                  </Typography>
                  <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                    (MM/DD/YYYY)
                  </Typography>
                </Box>
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Documents</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Schedule</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Remarks</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <CircularProgress />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  <Typography color="error">{error}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              applications.length > 0 ? (
                applications.map((application, index) => (
                  <TableRow key={application.application_id}>
                    <TableCell colSpan={3}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ width: '10%', wordBreak: 'break-word' }}>{index + 1}</Box>
                        <Box sx={{ width: '60%', wordBreak: 'break-word' }}>{application.full_name}</Box>
                        <Box
                          sx={{
                            width: '30%',
                            color: getStatusColor(application.application_status),
                            textAlign: 'center',
                            wordBreak: 'break-word',
                          }}
                        >
                          {application.application_status}
                        </Box>
                      </Box>
                    </TableCell>

                    <TableCell sx={{ wordBreak: 'break-word' }}>{new Date(application.application_date).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ wordBreak: 'break-word' }}>
                      <Tooltip title="View Document 1">
                        <Link href={`http://localhost:3000/applications/${application.applicant_id}/document/documentOne?ext=${application.document_one_ext}`} target="_blank" rel="noopener noreferrer">
                          <IconButton color="primary">
                            <SourceIcon />
                          </IconButton>
                        </Link>
                      </Tooltip>

                      <Tooltip title="View Document 2">
                        <Link href={`http://localhost:3000/applications/${application.applicant_id}/document/documentTwo?ext=${application.document_two_ext}`} target="_blank" rel="noopener noreferrer">
                          <IconButton color="primary">
                            <SourceIcon />
                          </IconButton>
                        </Link>
                      </Tooltip>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        bgcolor: (application.schedule_start && application.schedule_end) ? 'success.main' : theme.palette.common.white, 
                        borderBottom: (application.schedule_start && application.schedule_end) ? `1px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.common.white}`,
                        wordBreak: 'break-word'
                      }}
                    >
                      <Tooltip title={(application.schedule_start && application.schedule_end) ? "Edit Schedule" : "Add Schedule"}>
                        <IconButton
                          sx={{ color: (application.schedule_start && application.schedule_end) ? 'common.white' : theme.palette.primary.main }}
                          onClick={() => handleScheduleClick(application.application_id, application.schedule_start, application.schedule_end)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                    <TableCell 
                      sx={{ 
                        bgcolor: application.remarks ? 'success.main' : theme.palette.common.white, 
                        borderBottom: application.remarks ? `1px solid ${theme.palette.success.main}` : `1px solid ${theme.palette.common.white}`,
                        wordBreak: 'break-word'
                      }}
                    >
                      <Tooltip title={application.remarks ? "Edit Remarks" : "Add Remarks"}>
                        <IconButton
                          sx={{ color: application.remarks ? 'common.white' : theme.palette.primary.main }}
                          onClick={() => handleRemarksClick(application.application_id, application.remarks)}
                        >
                          <Edit />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={7} align="center">
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
    </Box>

    <Dialog open={openScheduleDialog} onClose={() => setOpenScheduleDialog(false)}>
      <DialogTitle>
        Schedule Exam
      </DialogTitle>
      
      <DialogContent sx={{ paddingTop: "20px !important" }}>
        <LocalizationProvider dateAdapter={AdapterDayjs}>
          <Box display="flex" flexDirection="column" gap={4}>
            <DateTimePicker
              label="Schedule Start"
              timezone="Asia/Manila"
              value={scheduleStart}
              onChange={(newValue) => setScheduleStart(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
            <DateTimePicker
              label="Schedule End"
              timezone="Asia/Manila"
              value={scheduleEnd}
              onChange={(newValue) => setScheduleEnd(newValue)}
              slotProps={{
                textField: {
                  fullWidth: true,
                },
              }}
            />
          </Box>
        </LocalizationProvider>
      </DialogContent>

      <DialogActions>
        <Button onClick={() => setOpenScheduleDialog(false)} color="error">
          Cancel
        </Button>
        <Button onClick={handleScheduleSubmit} color="primary" disabled={!scheduleStart || !scheduleEnd} variant='contained'>
          Schedule
        </Button>
      </DialogActions>
    </Dialog>

    <Dialog open={openRemarksDialog} onClose={() => setOpenRemarksDialog(false)} fullWidth>
      <DialogTitle>Add Remarks</DialogTitle>
      <DialogContent sx={{ paddingTop: "20px !important" }}>
        <TextField
          label="Remarks"
          value={remarks || ''}
          onChange={(e) => setRemarks(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) {
              e.preventDefault();
              handleRemarksSubmit();
            }
          }}
          fullWidth
          multiline
          rows={4}
        />
      </DialogContent>
      <DialogActions>
        <Button onClick={() => setOpenRemarksDialog(false)} color="error">
          Cancel
        </Button>
        <Button onClick={handleRemarksSubmit} color="primary" variant='contained'>
          Save Remarks
        </Button>
      </DialogActions>
    </Dialog>
  </>;
}
