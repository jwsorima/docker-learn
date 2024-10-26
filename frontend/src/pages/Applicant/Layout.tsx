//useContext?

import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  useMediaQuery,
  useTheme,
  IconButton,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { logout } from '../../utils/auth';

const drawerWidth = 240;

export default function ApplicantLayout() {
  const [active, setActive] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.down('md'));

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout('/applicants');
    navigate('/login');
  };

  const navItems = [
    {
      route: '/applicant',
      text: 'Dashboard',
      icon: <DashboardIcon style={{ color: 'white' }} />,
    },
    {
      route: '/applicant/submit',
      text: 'Submit Application',
      icon: <FileUploadIcon style={{ color: 'white' }} />,
    },
    {
      route: '/applicant/status',
      text: 'Application Status',
      icon: <AssignmentIcon style={{ color: 'white' }} />,
    },
  ];

  const drawerContent = (
    <>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 1 }}>
        <Typography variant="h6" noWrap sx={{ color: 'white' }}>
          Applicant Portal
        </Typography>
      </Toolbar>
      <Divider sx={{ borderColor: 'gray' }} />
      <List>
        {navItems.map((navItem) => (
          <ListItem
            disablePadding
            component={Link}
            to={navItem.route}
            key={navItem.route}
            sx={{ bgcolor: active === navItem.route ? 'primary.light' : undefined }}
          >
            <ListItemButton sx={{ paddingX: 1 }} onClick={() => setActive(navItem.route)}>
              <ListItemIcon sx={{ minWidth: '40px' }}>{navItem.icon}</ListItemIcon>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body1" style={{ color: 'white', textAlign: 'left' }}>
                    {navItem.text}
                  </Typography>
                }
              />
            </ListItemButton>
          </ListItem>
        ))}
      </List>
      <Divider sx={{ borderColor: 'gray' }} />
      <List sx={{ marginTop: 'auto' }}>
        <ListItem disablePadding sx={{ color: 'white' }}>
          <ListItemButton
            sx={{
              minHeight: 48,
              justifyContent: 'flex-start',
              px: 2.5,
            }}
            onClick={handleLogout}
          >
            <ListItemIcon
              sx={{
                minWidth: 0,
                mr: 3,
                justifyContent: 'center',
              }}
            >
              <LogoutIcon style={{ color: 'white' }} />
            </ListItemIcon>
            <ListItemText primary={'Logout'} />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <Box sx={{ display: 'flex', height: '100vh' }}>
      {isMd && (
        <AppBar
          position="fixed"
          sx={{
            zIndex: theme.zIndex.drawer + 1,
            backgroundColor: 'transparent',
            boxShadow: 'none',
          }}
        >
          <Toolbar sx={{ minHeight: 48 }}>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="start"
              onClick={handleDrawerToggle}
              sx={{
                mr: 2,
                backgroundColor: theme.palette.primary.main,
                borderRadius: 1,
                padding: 1,
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              <MenuIcon />
            </IconButton>
          </Toolbar>
        </AppBar>
      )}
      <Drawer
        variant={isMd ? 'temporary' : 'permanent'}
        open={isMd ? mobileOpen : true}
        onClose={handleDrawerToggle}
        ModalProps={{
          keepMounted: true,
        }}
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            boxSizing: 'border-box',
            backgroundColor: theme.palette.primary.dark,
          },
        }}
      >
        {drawerContent}
      </Drawer>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          bgcolor: 'background.default',
          p: 3,
          mt: isMd ? 6 : 0,
          overflow: 'auto',
          minWidth: 0,
        }}
      >
        <Outlet />
      </Box>
    </Box>
  );
}
