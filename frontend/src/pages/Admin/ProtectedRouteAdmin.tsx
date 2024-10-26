import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { Outlet } from 'react-router-dom';
import apiClient, { refreshTokenAdmin } from '../../utils/auth';
import AdminLoginPage from './LoginPage';
import { Loading } from '../../components/Loading';

type AuthContextType = {
  isAuthenticated: boolean;
  role: 'staff' | 'super_admin' | null;
  setAuthenticated: (status: boolean) => void;
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [isAuthenticated, setAuthenticated] = useState<boolean>(false);
  const [role, setRole] = useState<'staff' | 'super_admin' | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    const checkAuthentication = async () => {
      setIsLoading(true);
      try {
        const response = await apiClient.get('/staffs/auth-status');
        const user = response.data.user;

        if (user) {
          setAuthenticated(true);
          setRole(user.role);
        } else {
          setAuthenticated(false);
          setRole(null);
        }
      } catch {
        const refreshed = await refreshTokenAdmin();
        if (refreshed) {
          try {
            const response = await apiClient.get('/staffs/auth-status');
            const user = response.data.user;

            if (user) {
              setAuthenticated(true);
              setRole(user.role);
            } else {
              setAuthenticated(false);
              setRole(null);
            }
          } catch {
            setAuthenticated(false);
            setRole(null);
          }
        } else {
          setAuthenticated(false);
          setRole(null);
        }
      } finally {
        setIsLoading(false);
      }
    };

    checkAuthentication();
  }, []);

  return (
    <AuthContext.Provider value={{ isAuthenticated, role, setAuthenticated }}>
      {isLoading ? (
        <Loading />
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
};

export default function ProtectedRouteAdmin() {
  return (
    <AuthProvider>
      <ProtectedContent />
    </AuthProvider>
  );
}

const ProtectedContent = () => {
  const { isAuthenticated } = useAuth();

  if (!isAuthenticated) {
    return <AdminLoginPage />;
  }

  return <Outlet />;
};
