import axios from 'axios';

const apiClient = axios.create({
  baseURL: `${import.meta.env.VITE_BE_DOMAIN_NAME}`,
});

apiClient.interceptors.request.use(
  (config) => {
    const accessToken = localStorage.getItem('accessToken');
    if (accessToken) {
      config.headers['Authorization'] = `Bearer ${accessToken}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

export const logout = async (path: string) => {
  try {
    await apiClient.post(`${path}/logout`, {}, { withCredentials: true });
  } catch (error) {
    console.error('Error logging out:', error);
  } finally {
    localStorage.removeItem('accessToken');
  }
};

export const login = async (
  email: string,
  password: string,
  path: string // Pass the path (e.g., 'applicants/login' or 'admin/login')
): Promise<{ success: boolean; message: string; accessToken?: string; applicant?: any }> => {
  try {
    const response = await axios.post(
      `${import.meta.env.VITE_BE_DOMAIN_NAME}/${path}`,
      { email, password },
      { withCredentials: true }
    );

    if (response.data.login) {
      return {
        success: true,
        message: 'Login successful',
        accessToken: response.data.accessToken
      };
    }

    return { success: false, message: 'Incorrect email or password' };
  } catch (error: any) {
    if (axios.isAxiosError(error) && error.response) {
      if (error.response.status === 401) {
        return {
          success: false,
          message: 'Invalid credentials. Please check your email and password.',
        };
      } else {
        return {
          success: false,
          message: error.response.data?.message || 'Something went wrong. Please try again.',
        };
      }
    }
    return { success: false, message: 'Network error. Please try again later.' };
  }
};

export const refreshToken = async () => {
  try {
    const response = await apiClient.post('/applicants/refresh-token', {}, { withCredentials: true });
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      return true; // Successfully refreshed
    }
    return false; // Failed to refresh
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
};

export const refreshTokenAdmin = async () => {
  try {
    const response = await apiClient.post('/staffs/refresh-token', {}, { withCredentials: true });
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken);
      return true; // Successfully refreshed
    }
    return false; // Failed to refresh
  } catch (error) {
    console.error('Failed to refresh token:', error);
    return false;
  }
};

export default apiClient;
