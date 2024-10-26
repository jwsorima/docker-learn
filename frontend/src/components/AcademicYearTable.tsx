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
  IconButton,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Checkbox,
  darken,
  Typography,
} from '@mui/material';
import { Edit, Delete, CheckCircle } from '@mui/icons-material';
import axios from 'axios';
import { sidebarColor } from '../pages/Admin/Layout';

type AcademicYear = {
  academic_year_id: number;
  year_range: string;
  active: boolean;
};

export default function AcademicYearTable() {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [yearRange, setYearRange] = useState<string>('');
  const [active, setActive] = useState<boolean>(true);
  const [editingAcademicYear, setEditingAcademicYear] = useState<AcademicYear | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalAcademicYears, setTotalAcademicYears] = useState(0);
  const [yearRangeError, setYearRangeError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [academicYearToDelete, setAcademicYearToDelete] = useState<AcademicYear | null>(null);

  const fetchAcademicYears = async () => {
    try {
      const response = await axios.get('http://localhost:3000/academic_years', {
        params: {
          page: page,
          limit: rowsPerPage,
        },
      });
      setAcademicYears(response.data.academic_years);
      setTotalAcademicYears(response.data.total);
    } catch (error) {
      console.error('Error fetching academic years:', error);
    }
  };

  useEffect(() => {
    fetchAcademicYears();
  }, [page, rowsPerPage]);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setYearRange('');
    setActive(true);
    setYearRangeError(null);
    setShowValidation(false);
    setEditingAcademicYear(null);
  };

  const handleCreateAcademicYear = async () => {
    setShowValidation(true);
    if (!validateYearRange()) {
      return;
    }

    try {
      if (editingAcademicYear) {
        await axios.put(`http://localhost:3000/academic_years/${editingAcademicYear.academic_year_id}`, {
          year_range: yearRange,
          active: active,
        });
      } else {
        await axios.post('http://localhost:3000/academic_years', {
          year_range: yearRange,
          active: active,
        });
      }
      setYearRange('');
      setActive(true);
      setYearRangeError(null);
      setShowValidation(false);
      await fetchAcademicYears();
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating/updating academic year:', error);
    }
  };

  const handleEditAcademicYear = (academicYear: AcademicYear) => {
    setEditingAcademicYear(academicYear);
    setYearRange(academicYear.year_range);
    setActive(academicYear.active);
    setYearRangeError(null);
    setShowValidation(false);
    handleOpenDialog();
  };

  const handleDeleteAcademicYear = async () => {
    if (academicYearToDelete !== null) {
      try {
        await axios.delete(`http://localhost:3000/academic_years/${academicYearToDelete.academic_year_id}`);
        await fetchAcademicYears();
        handleCloseDeleteDialog();
      } catch (error) {
        console.error('Error deleting academic year:', error);
      }
    }
  };

  const handleOpenDeleteDialog = (academicYear: AcademicYear) => {
    setAcademicYearToDelete(academicYear);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setAcademicYearToDelete(null);
    setConfirmDelete(false);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const validateYearRange = () => {
    if (!yearRange.trim()) {
      setYearRangeError('Year range cannot be empty.');
      return false;
    }
    setYearRangeError(null);
    return true;
  };

  return (
    <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
      <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 8 }}>
        <Table sx={{ maxWidth: 650, tableLayout: 'fixed' }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ textAlign: 'left' }}>
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: sidebarColor,
                    '&:hover': { backgroundColor: darken(sidebarColor, 0.2) },
                  }}
                  onClick={handleOpenDialog}
                >
                  Add Academic Year
                </Button>
              </TableCell>
              <TableCell colSpan={2} sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '20px', color: 'primary.main' }}>
                Academic Years
              </TableCell>
            </TableRow>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', width: '50%' }}>Year Range</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '25%' }}>Active</TableCell>
              <TableCell sx={{ fontWeight: 'bold', width: '25%' }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {Array.isArray(academicYears) && academicYears.length > 0 ? (
              academicYears.map((academicYear) => (
                <TableRow key={academicYear.academic_year_id}>
                  <TableCell sx={{ wordBreak: 'break-word' }}>{academicYear.year_range}</TableCell>
                  <TableCell sx={{ wordBreak: 'break-word' }}>
                    {academicYear.active ? (
                      <CheckCircle color="success" />
                    ) : (
                      <span>&nbsp;</span>
                    )}
                  </TableCell>
                  <TableCell sx={{ wordBreak: 'break-word' }} align="right">
                    <IconButton color="primary" onClick={() => handleEditAcademicYear(academicYear)}>
                      <Edit />
                    </IconButton>
                    <IconButton color="error" onClick={() => handleOpenDeleteDialog(academicYear)}>
                      <Delete />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={3} align="center">
                  No academic years available
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={totalAcademicYears}
        page={page}
        onPageChange={handleChangePage}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        rowsPerPageOptions={[5, 10, 25]}
      />

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingAcademicYear ? 'Edit Academic Year' : 'Create Academic Year'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Year Range"
            value={yearRange}
            onChange={(e) => setYearRange(e.target.value)}
            error={!!yearRangeError && showValidation}
            helperText={showValidation && yearRangeError ? yearRangeError : ''}
            fullWidth
            sx={{ mt: 2 }}
          />
          <Box sx={{ display: 'flex', alignItems: 'center', mt: 2 }}>
            <Checkbox checked={active} onChange={(e) => setActive(e.target.checked)} />
            <Typography>Active</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="error">
            Cancel
          </Button>
          <Button onClick={handleCreateAcademicYear} color="primary" variant='contained'>
            {editingAcademicYear ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the academic year <strong>{academicYearToDelete?.year_range}</strong>? This
            action is permanent and cannot be undone.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Deleting this academic year may remove related data, such as course statuses. Please make sure you
            understand the consequences of this action.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
            />
            <Typography>I understand the consequences of deleting this academic year.</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteAcademicYear}
            color="error"
            variant="contained"
            sx={{ backgroundColor: 'error.main', color: 'white' }}
            disabled={!confirmDelete}
          >
            Delete Academic Year
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
