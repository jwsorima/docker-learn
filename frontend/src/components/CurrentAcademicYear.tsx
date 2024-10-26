import { useEffect, useState } from 'react';
import axios from 'axios';
import { Card, CardContent, Typography, CircularProgress } from '@mui/material';

type AcademicYear = {
  year_range: string;
};

export default function CurrentAcademicYear() {
  const [academicYear, setAcademicYear] = useState<AcademicYear | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    axios.get('http://localhost:3000/academic_years/current')
      .then((response) => {
        setAcademicYear(response.data);
      })
      .catch((_err) => {
        setError('Error fetching academic year.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, []);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">{error}</Typography>;
  }

  return (
    <Card
      variant="outlined"
      sx={{
        maxWidth: 400,
        margin: '20px auto',
        border: '1px solid',
        borderColor: 'primary.main',
        borderRadius: 1,
      }}
    >
      <CardContent>
        <Typography
          variant="h6"
          component="div"
          sx={{ fontWeight: 'bold', fontSize: '20px', color: 'primary.main' }}
        >
          Current Academic Year
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {academicYear ? academicYear.year_range : 'No active academic year found.'}
        </Typography>
      </CardContent>
    </Card>
  );
}
