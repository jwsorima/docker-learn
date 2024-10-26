import { Request, Response, Router } from "express";
import { createAcademicYear, deleteAcademicYear, getAcademicYearsPaged, getCurrentAcademicYear, updateAcademicYear } from "../db/yearsQueries.js";
const years = Router();

export type AcademicYear = {
  academic_year_id?: number;
  year_range: string;
  active: boolean;
};

years.post('/', async (req: Request, res: Response) => {
  const { year_range, active }: AcademicYear = req.body;
  try {
    await createAcademicYear(year_range, active);

    res.status(201).json({ message: 'Academic year created successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});


years.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
    const offset = page * limit;

    const { academicYears, total } = await getAcademicYearsPaged(limit, offset);

    res.status(200).json({
      academic_years: academicYears.rows,
      total: parseInt(total.rows[0].count, 10),
    });

  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

years.put('/:id', async (req: Request, res: Response) => {
  const academicYearID = req.params.id;
  const { year_range, active }: AcademicYear = req.body;

  try {
    const updateResult = await updateAcademicYear(parseInt(academicYearID, 10), year_range, active);

    if (updateResult.rowCount === 0) {
      res.status(404).json({ message: 'No rows updated. The academic year ID may not exist.' });
      return;
    }

    res.status(200).json({ message: 'Update successful' });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

years.delete('/:id', async (req: Request, res: Response) => {
  const academicYearID = parseInt(req.params.id, 10);

  if (isNaN(academicYearID)) {
    res.status(400).json({ message: 'Invalid academic year ID' }); return;
  }

  try {
    await deleteAcademicYear(academicYearID);

    res.status(200).json({ message: 'Academic year deleted successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting academic year:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});


years.get('/current', async (req: Request, res: Response) => {
  try {
    const currentYear = await getCurrentAcademicYear();

    res.status(200).json(currentYear.rows[0]);
  } catch (error) {
    if (error instanceof Error) {
      console.log(error);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

export default years;
