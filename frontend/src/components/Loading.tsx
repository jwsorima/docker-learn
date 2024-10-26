import CircularProgress from '@mui/material/CircularProgress';
import Box from '@mui/material/Box';

export const Loading: React.FC = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
      width="100vw"
      sx={{
        // backgroundColor: '#1249C6',
        backgroundSize: 'cover',
        backgroundPosition: 'center'
      }}
    >
      <CircularProgress size={80} />
    </Box>
  );
};

export const LoadingAdmin: React.FC = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100vh"
    >
      <CircularProgress size={80} />
    </Box>
  );
};

export const LoadingNoBg: React.FC = () => {
  return (
    <Box
      display="flex"
      justifyContent="center"
      alignItems="center"
      height="100%"
      width="100%"
    >
      <CircularProgress size={80} />
    </Box>
  );
};