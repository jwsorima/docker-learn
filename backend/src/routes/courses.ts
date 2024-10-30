import { Request, Response, Router } from "express";
import { createCourse, createCourseStatus, deleteCourse, getActiveCourses, getCoursesPaged, getCourseStatus, updateCourse } from "../db/coursesQueries.js";
const courses = Router();

export type Course = {
  course_id?: number;
  course_name: string;
  slots?: number;
};

courses.post('/', async (req: Request, res: Response) => {
  const course: Course = req.body;

  if (
    course.slots === undefined || 
    isNaN(course.slots)
  ) {
    res.status(400).json({ message: 'Invalid course_id or slots' }); return;
  }

  try {
    const createCourseOutput = await createCourse(course.course_name)

    await createCourseStatus(createCourseOutput.rows[0].course_id, course.slots)

    res.status(201).json({ message: 'Course created successfully' });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

courses.get('/', async (req: Request, res: Response) => {
  try {
    const page = Math.max(0, parseInt(req.query.page as string, 10) || 0);
    const limit = Math.max(1, parseInt(req.query.limit as string, 10) || 10);
    const offset = page * limit;

    const { courses, total } = await getCoursesPaged(limit, offset);
    
    const missingCourseStatus = await getCourseStatus();

    res.status(200).json({
      courses: courses.rows,
      total: parseInt(total.rows[0].count, 10),
      missingCourseStatus,
    });

  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

courses.get('/active', async (_req: Request, res: Response) => {
  try {
    const courses = await getActiveCourses();

    res.status(200).json({ courses });
  } catch (error) {
    if (error instanceof Error) {
      console.log(error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});

courses.put('/:id', async (req: Request, res: Response) => {
  const courseID = parseInt(req.params.id, 10);
  const newName = req.body.course_name;
  const slots = parseInt(req.body.slots, 10);

  if (isNaN(courseID) || isNaN(slots) || typeof newName !== 'string' || newName.trim() === '') {
    res.status(400).json({ message: 'Invalid course ID, course name, or slots' }); return;
  }

  try {
    const { courseUpdateResult, courseStatusUpdateResult } = await updateCourse(courseID, newName, slots);
    
    if (courseUpdateResult.rowCount === 0) {
      res.status(404).json({ message: 'No rows updated. The course ID may not exist.' }); return;
    }

    if (courseStatusUpdateResult.rowCount === 0) {
      res.status(404).json({ message: 'No rows updated for the course status. There may be no active academic year.' }); return;
    }
    
    res.status(200).json({ message: 'Update successful', courseUpdate: courseUpdateResult.rows, courseStatusUpdate: courseStatusUpdateResult.rows }); return;
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Course not found')) {
        res.status(404).json({ message: error.message }); return
      } else if (error.message.includes('No course status found')) {
        res.status(404).json({ message: error.message }); return;
      }

      console.error('Error updating course:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
});


courses.delete('/:id', async (req: Request, res: Response) => {
  const courseID = parseInt(req.params.id, 10);

  if (isNaN(courseID)) {
    res.status(400).json({ message: 'Invalid course ID' }); return;
  }

  try {
    const deleteResult = await deleteCourse(courseID);

    if (!deleteResult?.rowCount || deleteResult.rowCount === 0) {
      res.status(404).json({ message: 'No course deleted. The course ID may not exist.' }); return;
    }

    res.status(200).json({ message: 'Course deleted successfully' }); return;
  } catch (error) {
    if (error instanceof Error) {
      console.error('Error deleting course:', error.message);
      res.status(500).json({ message: 'Internal Server Error', error: error.message }); return
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ message: 'Internal Server Error' }); return;
    }
  }
});


courses.post('/status', async (req: Request, res: Response) => {
  const { course_id, slots } = req.body;

  try {
    await createCourseStatus(parseInt(course_id, 10), parseInt(slots, 10))

    res.status(201).json({ message: 'Course status created successfully' });
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes('Course status already exists')) {
        console.log(error.message);
        res.status(400).json({ message: error.message });
      } else {
        console.log(error.message);
        res.status(500).json({ message: 'Internal Server Error', error: error.message });
      }
    } else {
      console.log('An unexpected error occurred:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  }
  
});

export default courses;