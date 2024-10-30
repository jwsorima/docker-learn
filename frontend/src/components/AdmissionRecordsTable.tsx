import { useState, useEffect } from 'react';
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  TablePagination,
  Typography,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  useTheme,
  Tooltip,
  Skeleton,
} from '@mui/material';
import axios from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
import { AddressTooltip } from './StyledComponents';
import { formatStatus, getListStatusColor } from '../utils/stringUtils';

dayjs.extend(utc);
dayjs.extend(timezone);

export type AdmissionRecord = {
  admission_record_id: number;
  type: string;
  created_at: string;
  course_name: string;
  academic_year: string;
};

export type Application = {
  application_id: number;
  full_name: string;
  application_date: string;
  email: string;
  address: string;
  contact_number: string;
  sex: string;
  birthdate: string;
};

export default function AdmissionRecordsTable() {
  const theme = useTheme();
  const [admissions, setAdmissions] = useState<AdmissionRecord[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [totalAdmissions, setTotalAdmissions] = useState<number>(0);
  const [isApplicationsDialogOpen, setIsApplicationsDialogOpen] = useState<boolean>(false);
  const [selectedAdmissionId, setSelectedAdmissionId] = useState<number | null>(null);
  const [applicationsPage, setApplicationsPage] = useState<number>(0);
  const [applicationsRowsPerPage, setApplicationsRowsPerPage] = useState<number>(5);
  const [totalApplications, setTotalApplications] = useState<number>(0);

  useEffect(() => {
    const fetchAdmissions = async () => {
      setLoading(true);
      try {
        const response = await axios.get('http://localhost:3000/applications/lists', {
          params: {
            page: page,
            limit: rowsPerPage,
          },
        });
        setAdmissions(response.data.admissions);
        setTotalAdmissions(response.data.total);
      } catch (error) {
        console.error('Error fetching admissions:', error);
        setError('Failed to fetch admission records. Please try again later.');
      } finally {
        setLoading(false);
      }
    };

    fetchAdmissions();
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleViewApplications = async (admission_record_id: number) => {
    setSelectedAdmissionId(admission_record_id);
    setLoading(true);
    try {
      const response = await axios.get(`http://localhost:3000/applications/lists/${admission_record_id}`, {
        params: {
          page: applicationsPage,
          limit: applicationsRowsPerPage,
        },
      });
      setApplications(response.data.applications);
      setTotalApplications(response.data.total);
    } catch (error) {
      console.error('Error fetching applications:', error);
      setError('Failed to fetch applications. Please try again later.');
    } finally {
      setLoading(false);
      setIsApplicationsDialogOpen(true);
    }
  };

  const handleDownload = async (admission_record_id: number) => {
    try {
      const response = await axios.get(`http://localhost:3000/applications/lists/${admission_record_id}/download`, {
        responseType: 'blob',
      });

      const url = window.URL.createObjectURL(new Blob([response.data], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' }));
      
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `admission_${admission_record_id}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error downloading file:', error);
      setError('Failed to download the file. Please try again later.');
    }
  };
  

  const handleApplicationsPageChange = (_event: unknown, newPage: number) => {
    setApplicationsPage(newPage);
    handleViewApplications(selectedAdmissionId!);
  };

  const handleApplicationsRowsPerPageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setApplicationsRowsPerPage(parseInt(event.target.value, 10));
    setApplicationsPage(0);
    handleViewApplications(selectedAdmissionId!);
  };

  const handleDialogClose = () => {
    setIsApplicationsDialogOpen(false);
    setSelectedAdmissionId(null);
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <Typography variant="h4" sx={{ mb: 2, textAlign: 'center', color: 'primary.main' }}>
        Admission Records
      </Typography>
      
      <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 8, maxWidth: { xs: 400, sm: 612, lg: 940, xl: 1260 } }}>
        <Table sx={{ tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold' }}>Academic Year</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Course Name</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Type</TableCell>
              <TableCell sx={{ fontWeight: 'bold' }}>Created At</TableCell>
              <TableCell align='center' sx={{ fontWeight: 'bold' }}>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Skeleton variant="rectangular" height={40} width="100%" />
                </TableCell>
              </TableRow>
            ) : error ? (
              <TableRow>
                <TableCell colSpan={5} align="center">
                  <Typography color="error">{error}</Typography>
                </TableCell>
              </TableRow>
            ) : (
              admissions.map((admission) => (
                <TableRow 
                  key={admission.admission_record_id}
                  sx={{ 
                    '&:hover': { backgroundColor: theme.palette.action.hover },
                    transition: 'background-color 0.3s',
                  }}
                >
                  <TableCell>{admission.academic_year}</TableCell>
                  <TableCell>{admission.course_name}</TableCell>
                  <TableCell sx={{ color: getListStatusColor(theme, admission.type), fontWeight: 500 }}>
                    {formatStatus(admission.type as "" | "Passed" | "NotPassed" | "NoShow")}
                  </TableCell>
                  <TableCell>
                    {dayjs(admission.created_at)
                      .tz('Asia/Manila')
                      .format('YYYY-MM-DD HH:mm:ss')}
                  </TableCell>
                  <TableCell sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Tooltip title="View Applications">
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleViewApplications(admission.admission_record_id)}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        View
                      </Button>
                    </Tooltip>
                    <Tooltip title="Download Data">
                      <Button
                        variant="contained"
                        color="success"
                        onClick={() => handleDownload(admission.admission_record_id)}
                        sx={{ whiteSpace: 'nowrap' }}
                      >
                        Download
                      </Button>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalAdmissions}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
        sx={{ mt: 2 }}
      />

      <Dialog open={isApplicationsDialogOpen} onClose={handleDialogClose} fullWidth maxWidth="xl">
        <DialogTitle sx={{ fontWeight: 'bold', textAlign: 'center' }}>Applications for Admission ID {selectedAdmissionId}</DialogTitle>
        <DialogContent>
          {loading ? (
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Skeleton variant="rectangular" height={40} width="100%" />
            </Box>
          ) : (
            <TableContainer component={Paper}>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Application ID
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Full Name
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" alignItems="left">
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                          Application Date
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          (MM/DD/YYYY)
                        </Typography>
                      </Box>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Email
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Address
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Contact Number
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        Sex
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Box display="flex" flexDirection="column" alignItems="left">
                        <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                          Birthdate
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                          (MM/DD/YYYY)
                        </Typography>
                      </Box>
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {applications.map((application) => (
                    <TableRow key={application.application_id}>
                      <TableCell>{application.application_id}</TableCell>
                      <TableCell>{application.full_name}</TableCell>
                      <TableCell>{dayjs(application.application_date).format('YYYY-MM-DD')}</TableCell>
                      <TableCell>{application.email}</TableCell>
                      <TableCell>
                        <AddressTooltip title={application.address}>
                          <span>{application.address}</span>
                        </AddressTooltip>
                      </TableCell>
                      <TableCell>{application.contact_number}</TableCell>
                      <TableCell>{application.sex}</TableCell>
                      <TableCell>{dayjs(application.birthdate).format('YYYY-MM-DD')}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>

        <TablePagination
          component="div"
          count={totalApplications}
          page={applicationsPage}
          onPageChange={handleApplicationsPageChange}
          rowsPerPage={applicationsRowsPerPage}
          onRowsPerPageChange={handleApplicationsRowsPerPageChange}
          rowsPerPageOptions={[5, 10, 25]}
          sx={{ mt: 1 }}
        />

        <DialogActions>
          <Button onClick={handleDialogClose} color="primary" variant="contained">Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
