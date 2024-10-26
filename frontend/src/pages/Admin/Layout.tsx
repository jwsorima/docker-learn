import { useState } from 'react';
import { Link, Outlet, useNavigate } from 'react-router-dom';
import {
  Box,
  useMediaQuery,
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
  Divider,
} from '@mui/material';
import { useTheme, darken, lighten } from '@mui/material/styles';
import DashboardIcon from '@mui/icons-material/Dashboard';
import SchoolIcon from '@mui/icons-material/School';
import PeopleIcon from '@mui/icons-material/People';
import ListAltIcon from '@mui/icons-material/ListAlt';
import ManageAccountsIcon from '@mui/icons-material/ManageAccounts';
import LogoutIcon from '@mui/icons-material/Logout';
import MenuIcon from '@mui/icons-material/Menu';
import { logout } from '../../utils/auth';
import { useAuth } from './ProtectedRouteAdmin';
import Grid from '@mui/material/Grid2';

type NavItem = {
  route: string;
  text: string;
  icon: React.ReactNode;
};

const drawerWidth = 240;
export const sidebarColor = '#080cbc';

export default function AdminLayout() {
  const [active, setActive] = useState('');
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();
  const theme = useTheme();
  const isMd = useMediaQuery(theme.breakpoints.down('md'));

  const { role } = useAuth();

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleLogout = async () => {
    await logout('/staffs');
    navigate('/admin');
    window.location.reload();
  };
  
  const navItems: NavItem[] = [
    {
      route: '/admin',
      text: 'Dashboard',
      icon: <DashboardIcon style={{ color: 'white' }} />,
    },
    {
      route: '/admin/applicants',
      text: 'Manage Applicants',
      icon: <PeopleIcon style={{ color: 'white' }} />,
    },
    {
      route: '/admin/courses',
      text: 'Manage Courses',
      icon: <SchoolIcon style={{ color: 'white' }} />,
    },
    {
      route: '/admin/lists',
      text: 'Generate Lists',
      icon: <ListAltIcon style={{ color: 'white' }} />,
    }
  ];

  if (role === 'super_admin') {
    navItems.push({
      route: '/admin/staffs',
      text: 'Manage Staffs',
      icon: <ManageAccountsIcon style={{ color: 'white' }} />,
    });
  }

  const drawerContent = (
    <>
      <Toolbar sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 1 }}>
        <Typography variant="h6" noWrap sx={{ color: 'white', fontWeight: 'bold' }}>
          Admin
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
            sx={{ bgcolor: active === navItem.route ? lighten(sidebarColor, 0.3) : undefined }}
          >
            <ListItemButton sx={{ paddingX: 1 }} onClick={() => setActive(navItem.route)}>
              <ListItemIcon sx={{ minWidth: '40px' }}>{navItem.icon}</ListItemIcon>
              <ListItemText
                disableTypography
                primary={
                  <Typography variant="body1" style={{ color: 'white', textAlign: 'left', fontWeight: 'bold' }}>
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
            <ListItemText primary={'Logout'} primaryTypographyProps={{ fontWeight: 'bold' }} />
          </ListItemButton>
        </ListItem>
      </List>
    </>
  );

  return (
    <Grid container>
      <Grid size="grow">
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
                  backgroundColor: sidebarColor,
                  borderRadius: 1,
                  padding: 1,
                  '&:hover': {
                    backgroundColor: darken(sidebarColor, 0.2),
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
              backgroundColor: darken(sidebarColor, 0.3),
              zIndex: theme.zIndex.drawer + 1,
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Grid>
      <Grid 
        size="auto" 
        sx={{ 
          flexGrow: 0, 
          height: 'auto', 
          overflow: 'hidden', 
          maxWidth: isMd ? '100%' : `calc(100% - ${drawerWidth}px)` 
        }}
      >
        <Box
          component="main"
          sx={{
            overflowY: 'auto',
            overflowX: 'hidden',
            bgcolor: 'background.default',
            p: 3,
            mt: isMd ? 6 : 0,
          }}
        >
          <Outlet />
        </Box>
      </Grid>
    </Grid>
  );
}
