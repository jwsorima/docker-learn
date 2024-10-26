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
  Typography,
  darken,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Snackbar,
  Alert
} from '@mui/material';
import { Edit, Delete } from '@mui/icons-material';
import axios from 'axios';
import { sidebarColor } from './Layout';
import { useAuth } from './ProtectedRouteAdmin';
import { useNavigate } from 'react-router-dom';
import { Loading } from '../../components/Loading';

type Staff = {
  staff_id: number;
  full_name: string;
  email: string;
  sex: string;
};

export default function Staffs() {
  const [staffs, setStaffs] = useState<Staff[]>([]);
  const [fullName, setFullName] = useState<string>('');
  const [email, setEmail] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [confirmPassword, setConfirmPassword] = useState<string>('');
  const [sex, setSex] = useState<string>('');
  const [editingStaff, setEditingStaff] = useState<Staff | null>(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalStaffs, setTotalStaffs] = useState(0);
  const [dialogOpen, setDialogOpen] = useState<boolean>(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState<boolean>(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<boolean>(false);
  const [showValidation, setShowValidation] = useState<boolean>(false);
  const [showPasswordFields, setShowPasswordFields] = useState<boolean>(false);

  const [fullNameError, setFullNameError] = useState<string | null>(null);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [confirmPasswordError, setConfirmPasswordError] = useState<string | null>(null);
  const [sexError, setSexError] = useState<string | null>(null);

  const [snackbarOpen, setSnackbarOpen] = useState<boolean>(false);
  const [snackbarMessage, setSnackbarMessage] = useState<string>('');
  const [snackbarSeverity, setSnackbarSeverity] = useState<'success' | 'error' | 'warning' | 'info'>('info');

  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { role } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (role !== 'super_admin') {
      navigate('/admin', { replace: true });
    } else {
      setIsLoading(false);
    }
  }, [role, navigate]);

  const fetchStaffs = async () => {
    try {
      const response = await axios.get('http://localhost:3000/staffs', {
        params: {
          page: page,
          limit: rowsPerPage,
        },
      });
      setStaffs(response.data.staffs);
      setTotalStaffs(response.data.total);
    } catch (error) {
      console.error('Error fetching staffs:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (role === 'super_admin') {
      fetchStaffs();
    }
  }, [page, rowsPerPage, role]);

  const handleOpenDialog = () => {
    setDialogOpen(true);
  };

  if (isLoading) {
    return <Loading />
  }

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setFullName('');
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setSex('');
    setFullNameError(null);
    setEmailError(null);
    setPasswordError(null);
    setConfirmPasswordError(null);
    setSexError(null);
    setShowValidation(false);
    setShowPasswordFields(false);
    setEditingStaff(null);
  };

  const handleCreateOrUpdateStaff = async () => {
    setShowValidation(true);
    if (!validateStaffFields()) {
      return;
    }

    try {
      if (editingStaff) {
        await axios.put(`http://localhost:3000/staffs/${editingStaff.staff_id}`, {
          full_name: fullName,
          email: email,
          sex: sex,
          password: showPasswordFields ? password : undefined,
        });
      } else {
        await axios.post('http://localhost:3000/staffs', {
          full_name: fullName,
          email: email,
          sex: sex,
          password: password,
        });
      }
      await fetchStaffs();
      handleCloseDialog();

      setSnackbarMessage(editingStaff ? 'Staff updated successfully' : 'Staff created successfully');
      setSnackbarSeverity('success');
      setSnackbarOpen(true);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.data?.message === 'Email already exists') {
          setSnackbarMessage('Email already exists');
          setSnackbarSeverity('error');
        } else {
          setSnackbarMessage('Failed to create/update staff');
          setSnackbarSeverity('error');
        }
      } else {
        console.error('Unexpected error:', error);
        setSnackbarMessage('An unexpected error occurred');
        setSnackbarSeverity('error');
      }
      setSnackbarOpen(true);
    }
  };

  const handleEditStaff = (staff: Staff) => {
    setEditingStaff(staff);
    setFullName(staff.full_name);
    setEmail(staff.email);
    setSex(staff.sex);
    handleOpenDialog();
  };

  const handleDeleteStaff = async () => {
    if (staffToDelete !== null) {
      try {
        await axios.delete(`http://localhost:3000/staffs/${staffToDelete.staff_id}`);
        await fetchStaffs();
        handleCloseDeleteDialog();
      } catch (error) {
        console.error('Error deleting staff:', error);
      }
    }
  };

  const handleOpenDeleteDialog = (staff: Staff) => {
    setStaffToDelete(staff);
    setDeleteDialogOpen(true);
  };

  const handleCloseDeleteDialog = () => {
    setDeleteDialogOpen(false);
    setStaffToDelete(null);
    setConfirmDelete(false);
  };

  const handleChangePage = (_event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const validateStaffFields = () => {
    let isValid = true;
  
    if (!fullName.trim()) {
      setFullNameError('Full Name cannot be empty.');
      isValid = false;
    } else {
      setFullNameError(null);
    }
  
    if (!email.trim()) {
      setEmailError('Email cannot be empty.');
      isValid = false;
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      setEmailError('Email format is invalid.');
      isValid = false;
    } else {
      setEmailError(null);
    }
  
    if (!sex) {
      setSexError('Sex is required.');
      isValid = false;
    } else {
      setSexError(null);
    }
  
    if (!editingStaff && !password.trim()) {
      setPasswordError('Password is required.');
      isValid = false;
    } else if (password !== confirmPassword) {
      setPasswordError('Passwords do not match.');
      setConfirmPasswordError('Passwords do not match.');
      isValid = false;
    } else {
      setPasswordError(null);
      setConfirmPasswordError(null);
    }
  
    return isValid;
  };
  

  return (
    <>
      <Box sx={{ flexGrow: 1, display: 'flex', flexDirection: 'column' }}>
        <TableContainer component={Paper} sx={{ flexGrow: 1, boxShadow: 8, maxWidth: { xs: 400, sm: 612, lg: 940, xl: 1260 }  }}>
          <Table sx={{ tableLayout: 'fixed' }}>
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
                    Add Staff
                  </Button>
                </TableCell>
                <TableCell colSpan={3} sx={{ textAlign: 'center', fontWeight: 'bold', fontSize: '20px', color: 'primary.main' }}>
                  Staffs
                </TableCell>
              </TableRow>
              <TableRow>
                <TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                    <Box sx={{ width: '50%' }}>Full Name</Box>
                    <Box sx={{ width: '30%' }}>Email</Box>
                    <Box sx={{ width: '20%', textAlign: 'center' }}>Sex</Box>
                  </Box>
                </TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.isArray(staffs) && staffs.length > 0 ? (
                staffs.map((staff) => (
                  <TableRow key={staff.staff_id}>
                    <TableCell colSpan={3}>
                      <Box sx={{ display: 'flex', flexDirection: 'row', alignItems: 'center', width: '100%' }}>
                        <Box sx={{ width: '50%', wordBreak: 'break-word' }}>{staff.full_name}</Box>
                        <Box sx={{ width: '30%', wordBreak: 'break-word' }}>{staff.email}</Box>
                        <Box sx={{ width: '20%', textAlign: 'center', wordBreak: 'break-word' }}>{staff.sex}</Box>
                      </Box>
                    </TableCell>
                    <TableCell align="right">
                      <IconButton color="primary" onClick={() => handleEditStaff(staff)}>
                        <Edit />
                      </IconButton>
                      <IconButton color="error" onClick={() => handleOpenDeleteDialog(staff)}>
                        <Delete />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No staff members available.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        <TablePagination
          component="div"
          count={totalStaffs}
          page={page}
          onPageChange={handleChangePage}
          rowsPerPage={rowsPerPage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          rowsPerPageOptions={[5, 10, 25]}
        />
      </Box>

      <Dialog open={dialogOpen} onClose={handleCloseDialog} fullWidth maxWidth="sm">
        <DialogTitle>{editingStaff ? 'Edit Staff' : 'Create Staff'}</DialogTitle>
        <DialogContent>
          <TextField
            label="Full Name"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            error={!!fullNameError && showValidation}
            helperText={showValidation && fullNameError ? fullNameError : ''}
            fullWidth
            sx={{ mt: 2 }}
          />
          <FormControl fullWidth sx={{ mt: 2 }} error={!!sexError && showValidation}>
            <InputLabel id="sex-label">Sex</InputLabel>
            <Select
              labelId="sex-label"
              id="sex"
              label="Sex"
              value={sex}
              onChange={(e) => setSex(e.target.value)}
            >
              <MenuItem value="Male">Male</MenuItem>
              <MenuItem value="Female">Female</MenuItem>
            </Select>
            {showValidation && sexError && <Typography color="error">{sexError}</Typography>}
          </FormControl>
          <TextField
            label="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={!!emailError && showValidation}
            helperText={showValidation && emailError ? emailError : ''}
            fullWidth
            sx={{ mt: 2 }}
          />

          {editingStaff && (
            <Button
              variant="outlined"
              sx={{ mt: 2 }}
              onClick={() => setShowPasswordFields((prev) => !prev)}
            >
              {showPasswordFields ? 'Cancel Change Password' : 'Change Password'}
            </Button>
          )}

          {(showPasswordFields || !editingStaff) && (
            <>
              <TextField
                label="Password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                error={!!passwordError && showValidation}
                helperText={showValidation && passwordError ? passwordError : ''}
                fullWidth
                sx={{ mt: 2 }}
                required={!editingStaff}
              />
              <TextField
                label="Confirm Password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                error={!!confirmPasswordError && showValidation}
                helperText={showValidation && confirmPasswordError ? confirmPasswordError : ''}
                fullWidth
                sx={{ mt: 2 }}
                required={!editingStaff}
              />
            </>
          )}

        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="error">
            Cancel
          </Button>
          <Button onClick={handleCreateOrUpdateStaff} color="primary" variant="contained">
            {editingStaff ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleCloseDeleteDialog}>
        <DialogTitle sx={{ color: 'error.main' }}>Confirm Deletion</DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            Are you sure you want to delete the staff <strong>{staffToDelete?.full_name}</strong>? This action is
            permanent and cannot be undone.
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Checkbox checked={confirmDelete} onChange={(e) => setConfirmDelete(e.target.checked)} />
            <Typography>I understand the consequences of deleting this staff member.</Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDeleteDialog} color="primary">
            Cancel
          </Button>
          <Button
            onClick={handleDeleteStaff}
            color="error"
            variant="contained"
            disabled={!confirmDelete}
          >
            Delete Staff
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={6000}
        onClose={() => setSnackbarOpen(false)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: '100%' }}>
          {snackbarMessage}
        </Alert>
      </Snackbar>
    </>
  );
}
