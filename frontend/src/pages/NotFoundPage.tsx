import React from 'react';
import { Box, Button, Typography, Container, CssBaseline, ThemeProvider } from '@mui/material';
import { useTheme } from '@mui/material/styles';
import { useNavigate } from 'react-router-dom';

const NotFoundPage: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Container className="notFoundPageContainer">
        <Box bgcolor="#fafafa" p={4} borderRadius={2} display="inline-block" boxShadow={8} mt={2} maxWidth={500}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <Typography component="h1" variant="h4" color={theme.palette.primary.main} sx={{ mt: 2 }}>
              404 - Page Not Found
            </Typography>
            <Typography component="p" variant="body1" color={theme.palette.primary.main} sx={{ mt: 1, textAlign: 'center' }}>
              The page you are looking for might have been removed, had its name changed, or is temporarily unavailable.
            </Typography>
            <Button
              variant="contained"
              color="primary"
              sx={{ mt: 3, mb: 2 }}
              onClick={handleGoHome}
            >
              Go to Homepage
            </Button>
          </Box>
        </Box>
      </Container>
    </ThemeProvider>
  );
};

export default NotFoundPage;