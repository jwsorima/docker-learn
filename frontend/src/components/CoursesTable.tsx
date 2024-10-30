//putting long course name doesnt make it stretch?
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
import { Edit, Delete } from '@mui/icons-material';
import axios from 'axios';
import { sidebarColor } from '../pages/Admin/Layout';

type Course = {
  course_id: number;
  course_name: string;
  slots: number;
};

export default function CoursesTable() {
  const [courses, setCourses] = useState<Course[]>([]);
  const [courseName, setCourseName] = useState<string>('');
  const [slots, setSlots] = useState<number | null>(0);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalCourses, setTotalCourses] = useState(0);
  const [courseNameError, setCourseNameError] = useState<string | null>(null);
  const [slotsError, setSlotsError] = useState<string | null>(null);
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [courseToDelete, setCourseToDelete] = useState<Course | null>(null);

  const fetchCourses = async () => {
    try {
      const response = await axios.get('http://localhost:3000/courses', {
        params: {
          page: page,
          limit: rowsPerPage,
        },
      });

      setCourses(response.data.courses);
      setTotalCourses(response.data.total);

      const missingCourseStatus = response.data.missingCourseStatus || [];

      if (missingCourseStatus.length > 0) {
        for (const course of missingCourseStatus) {
          await insertMissingCourseStatus(course.course_id);
        }
        window.location.reload();
      }
    } catch (error) {
      console.error('Error fetching courses:', error);
    }
  };

  const insertMissingCourseStatus = async (course_id: number) => {
    try {
      await axios.post('http://localhost:3000/courses/status', {
        course_id: course_id,
        slots: slots
      });
    } catch (error) {
      console.error(`Error inserting course_status for course ID ${course_id}:`, error);
    }
  };

  useEffect(() => {
    fetchCourses();
  }, [page, rowsPerPage]);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setCourseName('');
    setSlots(0);
    setCourseNameError(null);
    setSlotsError(null);
    setShowValidation(false);
    setEditingCourse(null);
  };

  const handleCreateCourse = async () => {
    setShowValidation(true);
    if (!validateCourseFields()) {
      return;
    }

    try {
      if (editingCourse) {
        await axios.put(`http://localhost:3000/courses/${editingCourse.course_id}`, {
          course_name: courseName,
          slots: slots,
        });
      } else {
        await axios.post('http://localhost:3000/courses', {
          course_name: courseName,
          slots: slots,
        });
      }
      setCourseName('');
      setSlots(null);
      setCourseNameError(null);
      setSlotsError(null);
      setShowValidation(false);
      await fetchCourses();
      handleCloseDialog();
    } catch (error) {
      console.error('Error creating/updating course:', error);
    }
  };

  const handleEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseName(course.course_name);
    setSlots(course.slots);
    setCourseNameError(null);
    setSlotsError(null);
    setShowValidation(false);
    handleOpenDialog();
  };

  const handleDeleteCourse = async () => {
    if (courseToDelete !== null) {
      try {
        await axios.delete(`http://localhost:3000/courses/${courseToDelete.course_id}`);
        await fetchCourses();
        handleCloseDeleteDialog();
      } catch (error) {
        console.error('Error deleting course:', error);
      }
    }
  };

  const handleSlotsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    const parsedValue = parseInt(value, 10);
    setSlots(isNaN(parsedValue) ? null : parsedValue);
  };

  const handleOpenDeleteDialog = (course: Course) => {
    setCourseToDelete(course);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setCourseToDelete(null);
    setConfirmDelete(false);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const validateCourseFields = () => {
    let isValid = true;

    if (!courseName.trim()) {
      setCourseNameError('Course name cannot be empty.');
      isValid = false;
    } else if (courseName.trim().length < 3) {
      setCourseNameError('Course name must be at least 3 characters long.');
      isValid = false;
    } else {
      setCourseNameError(null);
    }

    if (!slots || slots < 0) {
      setSlotsError('Slots cannot be negative.');
      isValid = false;
    } else {
      setSlotsError(null);
    }

    return isValid;
  };

  return (
    <>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 8 }}>
          <Table sx={{ maxWidth: 820, tableLayout: 'fixed' }}>
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
                    Add Course
                  </Button>
                </TableCell>
                <TableCell colSpan={2} sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '20px', color: 'primary.main' }}>
                  Courses
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                    <Box sx={{ width: '80%', wordBreak: 'break-word' }}>Course Name</Box>
                    <Box sx={{ width: '20%', textAlign: 'right', wordBreak: 'break-word' }}>Slots</Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold'}} align="right">
                  Actions
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(courses) && courses.length > 0 ? (
                courses.map((course) => (
                  <TableRow key={course.course_id}>
                    <TableCell colSpan={2}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'flex-start', width: '100%' }}>
                        <Box sx={{ wordBreak: 'break-word', width: '80%' }}>{course.course_name}</Box>
                        <Box sx={{ wordBreak: 'break-word', width: '20%', textAlign: 'right' }}>
                          {course.slots != null && course.slots > 0 ? course.slots : 'Set slots for current year'}
                        </Box>
                      </Box>
                    </TableCell>
                    <TableCell sx={{ wordBreak: 'break-word' }} align="right">
                      <IconButton color="primary" onClick={() => handleEditCourse(course)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleOpenDeleteDialog(course)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No courses available
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalCourses}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingCourse ? 'Edit Course' : 'Create Course'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Course Name"
            value={courseName}
            onChange={(e) => setCourseName(e.target.value)}
            error={!!courseNameError && showValidation}
            helperText={showValidation && courseNameError ? courseNameError : ''}
            fullWidth
            sx={{ mt: 2 }}
          />
          <TextField
            label="Slots"
            type="number"
            value={slots !== null && slots !== undefined ? slots : ''}
            onChange={handleSlotsChange}
            error={!!slotsError && showValidation}
            helperText={showValidation && slotsError ? slotsError : ''}
            fullWidth
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="error">
            Cancel
          </Button>
          <Button onClick={handleCreateCourse} color="primary" variant='contained'>
            {editingCourse ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the course <strong>{courseToDelete?.course_name}</strong>? This action is
            permanent and cannot be undone.
          </Typography>
          <Typography variant="body2" color="error" sx={{ mb: 2 }}>
            Deleting this course may remove related data. Please make sure you understand the consequences of this
            action.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox
              checked={confirmDelete}
              onChange={(e) => setConfirmDelete(e.target.checked)}
            />
            <Typography>I understand the consequences of deleting this course.</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteCourse}
            color="error"
            variant="contained"
            sx={{ backgroundColor: 'error.main', color: 'white' }}
            disabled={!confirmDelete}
          >
            Delete Course
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
