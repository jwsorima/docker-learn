import { Box } from "@mui/material";
import AcademicYearTable from "../../components/AcademicYearTable";
import CoursesTable from "../../components/CoursesTable";

export default function Courses() {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', p: 3, alignItems: 'center', justifyContent: 'center' }}>
      <AcademicYearTable />

      <CoursesTable />
    </Box>
  );
}