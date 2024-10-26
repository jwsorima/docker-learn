import { Box } from '@mui/material';
import CurrentAcademicYear from "../../components/CurrentAcademicYear";
import ApplicationsTable from '../../components/ApplicationsTable';
import ApplicantsTable from '../../components/ApplicantsTable';

export default function Applicants() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'start' }} gap={4}>
      <CurrentAcademicYear />

      <ApplicationsTable />

      <ApplicantsTable />
    </Box>
  );
}
