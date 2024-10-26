import { useState, useEffect, startTransition } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { Loading } from '../../components/Loading';
import apiClient, { refreshToken } from '../../utils/auth';

const ApplicantProtectedRoute = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const checkAuthentication = async () => {
      try {
        await apiClient.get('/applicants/auth-status');;
        setIsLoggedIn(true);
      } catch (error) {
        const refreshed = await refreshToken();
        if (refreshed) {
          try {
            await apiClient.get('/applicants/auth-status');
            setIsLoggedIn(true);
          } catch (retryError) {
            setIsLoggedIn(false);
          }
        } else {
          setIsLoggedIn(false);
        }
      } finally {
        setTimeout(() => {
          startTransition(() => {
            setIsLoading(false);
          });
        }, 1000);
      }
    };

    checkAuthentication();
  }, []);

  if (isLoading) {
    return <Loading />;
  }

  return isLoggedIn ? <Outlet /> : <Navigate to="/login" replace />;
};

export default ApplicantProtectedRoute;
