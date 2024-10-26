import { useEffect, useState } from 'react';
import axios from 'axios';
import {
  Box,
  CircularProgress,
  Table,
  TableHead,
  TableBody,
  TableCell,
  TableRow,
  TableContainer,
  Paper,
  Typography,
  TablePagination,
} from '@mui/material';
import { AddressTooltip } from './StyledComponents';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

type Applicant = {
  applicant_id: number;
  full_name: string;
  address: string;
  contact_number: string;
  email: string;
  sex: string;
  birthdate: string;
};

export default function ApplicantsTable() {
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(0);
  const [rowsPerPage, setRowsPerPage] = useState<number>(5);
  const [totalApplicants, setTotalApplicants] = useState<number>(0);

  useEffect(() => {
    setLoading(true);
    axios
      .get('http://localhost:3000/applicants', {
        params: {
          page: page,
          limit: rowsPerPage,
        },
      })
      .then((response) => {
        setApplicants(response.data.applicants);
        setTotalApplicants(parseInt(response.data.total, 10));
      })
      .catch(() => {
        setError('Error fetching applicants.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [page, rowsPerPage]);

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 8 }}>
        <Table sx={{ maxWidth: { xs: 400, sm: 612, lg: 940, xl: 1260 }, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell colSpan={7} sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '20px', color: 'primary.main' }}>
                All Applicants
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ width: '10%', textAlign: 'left' }}>#</Box>
                  <Box sx={{ width: '90%', textAlign: 'center' }}>Full Name</Box>
                </Box>
              </TableCell>
              <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ width: '60%', textAlign: 'left' }}>Address</Box>
                  <Box sx={{ width: '40%', textAlign: 'right' }}>Contact Number</Box>
                </Box>
              </TableCell>
              <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                  <Box sx={{ flex: '4 1 0', textAlign: 'left' }}>Email</Box>
                  <Box sx={{ flex: '1 1 0', textAlign: 'center' }}>Sex</Box>
                  <Box sx={{ flex: '2 1 0', textAlign: 'right', flexDirection: 'column', display: 'flex' }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', fontSize: '0.875rem' }}>
                      Birthdate
                    </Typography>
                    <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem' }}>
                      (MM/DD/YYYY)
                    </Typography>
                  </Box>
                </Box>
              </TableCell>

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
            ) : applicants.length > 0 ? (
              applicants.map((applicant, index) => (
                <TableRow key={applicant.applicant_id}>
                  <TableCell colSpan={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ width: '10%', wordBreak: 'break-word' }}>
                        {index + 1}
                      </Box>
                      <Box sx={{ width: '90%', wordBreak: 'break-word', textAlign: 'center' }}>
                        {applicant.full_name}
                      </Box>
                    </Box>
                  </TableCell>

                  <TableCell colSpan={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                      <Box
                        sx={{
                          flex: '3 1 0',
                          wordBreak: 'break-word',
                          textAlign: 'left',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          maxWidth: '100%',
                        }}
                      >
                        <AddressTooltip
                          title={
                            <>
                              <Typography variant="body2" color="textSecondary" component="div">
                                {applicant.address}
                              </Typography>
                            </>
                          }
                          enterTouchDelay={0}
                          leaveTouchDelay={500}
                        >
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                            {applicant.address}
                          </span>
                        </AddressTooltip>
                      </Box>
                      <Box
                        sx={{
                          flex: '2 1 0',
                          wordBreak: 'break-word',
                          textAlign: 'right',
                        }}
                      >
                        {applicant.contact_number}
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell colSpan={3}>
                    <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                      <Box sx={{ flex: '4 1 0', wordBreak: 'break-word', textAlign: 'left' }}>
                        {applicant.email}
                      </Box>
                      <Box sx={{ flex: '1 1 0', textAlign: 'center' }}>
                        {applicant.sex}
                      </Box>
                      <Box sx={{ flex: '2 1 0', textAlign: 'right' }}>
                        {dayjs(applicant.birthdate).format('MM/DD/YYYY')}
                      </Box>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7} align="center">
                  No applicants found.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>


      <TablePagination
        component="div"
        count={totalApplicants}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />
    </Box>
  );
}