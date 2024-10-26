import { Box, Button, Typography, Container } from '@mui/material';
import { Link } from 'react-router-dom';

export default function Home() {
  return (
    <Container className="landingPageContainer">
      <Container component="main" maxWidth="sm" sx={{ zIndex: 2, width: { xs: '75%', sm: '60%', md: '50%' } }}>
        <Box
          sx={{
            marginTop: 8,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
          }}
        >
          <Box
            sx={{
              backgroundColor: '#ffffff',
              padding: 3,
              borderRadius: 2,
              boxShadow: 2,
              width: '100%',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
            }}
          >
            <Typography 
              component="h1" 
              variant="h4"
              className="anton-regular"
              sx={{ 
                mb: 4,
                fontWeight: '700',  
                fontSize: {
                  xs: '1.5rem',
                  sm: '2rem',
                  md: '2.2rem',
                },
                color: '#010CBC',
                textAlign: 'center'
              }}
            >
              ADMISSIONS PORTAL
            </Typography>
            <Button
              component={Link}
              to="/login"
              variant="contained"
              color="primary"
              sx={{ mb: 2, width: '100%' }}
            >
              Login
            </Button>
            <Button
              component={Link}
              to="/register"
              variant="outlined"
              color="primary"
              sx={{ width: '100%' }}
            >
              Register
            </Button>
          </Box>
        </Box>
      </Container>
    </Container>
  );
}
