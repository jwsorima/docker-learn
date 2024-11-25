import { lazy, Suspense } from 'react';
import { Loading } from './components/Loading';
import Home from './pages/Home';
import { createTheme, CssBaseline, GlobalStyles, ThemeProvider } from '@mui/material';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
const LoginPage = lazy(() => import('./pages/LoginPage'));
const NotFoundPage = lazy(() => import('./pages/NotFoundPage'));
const Register = lazy(() => import('./pages/Register'));

const ApplicantProtectedRoute = lazy(() => import('./pages/Applicant/ProtectedRoute'));
const ApplicantLayout = lazy(() => import('./pages/Applicant/Layout'));
const Dashboard = lazy(() => import('./pages/Applicant/Dashboard'));
const SubmitApplication = lazy(() => import('./pages/Applicant/SubmitApplication'));
const ApplicationStatus = lazy(() => import('./pages/Applicant/ApplicationStatus'));

const ProtectedRouteAdmin = lazy(() => import('./pages/Admin/ProtectedRouteAdmin'));
const AdminLayout = lazy(() => import('./pages/Admin/Layout'));
const AdminDashboard = lazy(() => import('./pages/Admin/Dashboard'));
const Applicants = lazy(() => import('./pages/Admin/Applicants'));
const Courses = lazy(() => import('./pages/Admin/Courses'));
const Lists = lazy(() => import('./pages/Admin/Lists'));
const Staffs = lazy(() => import('./pages/Admin/Staffs'));

import './assets/App.css';

const queryClient = new QueryClient()

function App() {
  const theme = createTheme({
    palette: {
      primary: {
        main: '#1045cc',
      },
      secondary: {
        main: '#b0e5eb',
      },
    },
    typography: {
      fontFamily: 'Inter, sans-serif'
    },
    components: {
      MuiDrawer: {
        styleOverrides: {
          paper: {
            backgroundColor: "#666666",
          },
        },
      },
    },
  });

  const globalStyles = (
    <GlobalStyles
      styles={{
        body: {
          backgroundColor: 'transparent',
        },
      }}
    />
  );


  return (
    <QueryClientProvider client={queryClient}>
    <ThemeProvider theme={theme}>
      <CssBaseline />
      {globalStyles}
      <Suspense fallback={<Loading />}>
      <Router>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="login" element={<LoginPage />} />
          <Route path="register" element={<Register />} />

          <Route element={<ApplicantProtectedRoute />}>
            <Route element={<ApplicantLayout />}>
              <Route
                path="applicant"
                element={
                  <Suspense fallback={<Loading />}>
                    <Dashboard />
                  </Suspense>
                }
              />
              <Route
                path="applicant/submit"
                element={
                  <Suspense fallback={<Loading />}>
                    <SubmitApplication />
                  </Suspense>
                }
              />
              <Route
                path="applicant/status"
                element={
                  <Suspense fallback={<Loading />}>
                    <ApplicationStatus />
                  </Suspense>
                }
              />
            </Route>
          </Route>

          <Route element={<ProtectedRouteAdmin />}>
            <Route element={<AdminLayout />}>
              <Route 
                path="admin"
                element={
                  <Suspense fallback={<Loading />}>
                    <AdminDashboard />
                  </Suspense>
                }
              />
              <Route 
                path="admin/applicants"
                element={
                  <Suspense fallback={<Loading />}>
                    <Applicants />
                  </Suspense>
                }
              />
              <Route 
                path="admin/courses"
                element={
                  <Suspense fallback={<Loading />}>
                    <Courses />
                  </Suspense>
                }
              />
              <Route 
                path="admin/lists"
                element={
                  <Suspense fallback={<Loading />}>
                    <Lists />
                  </Suspense>
                }
              />
              <Route 
                path="admin/staffs"
                element={
                  <Suspense fallback={<Loading />}>
                    <Staffs />
                  </Suspense>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </Router>
      </Suspense>
    </ThemeProvider>
    </QueryClientProvider>
  )
}

export default App
