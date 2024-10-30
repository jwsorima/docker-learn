import { dbQuery } from './index.js'

function isDatabaseError(error: unknown): error is { code: string } {
  return typeof error === 'object' && error !== null && 'code' in error;
}

export async function createCourse(courseName: string) {
  return await dbQuery(`
    INSERT INTO courses (course_name) 
    VALUES ($1)
     RETURNING *
  `, [courseName])
}

export async function createCourseStatus(courseID: number, slots: number) {
  const defaultStatus = 'Active';

  try {
    await dbQuery('BEGIN');

    const activeResult = await dbQuery(`
      SELECT academic_year_id FROM academic_year WHERE active = TRUE LIMIT 1;
    `);

    const activeAcademicYearID = activeResult.rows[0]?.academic_year_id;

    if (!activeAcademicYearID) {
      throw new Error('No active academic year found');
    }

    const existingStatusResult = await dbQuery(`
      SELECT course_status_id
      FROM course_status
      WHERE course_id = $1 AND academic_year_id = $2
      LIMIT 1;
    `, [courseID, activeAcademicYearID]);

    if (existingStatusResult.rows.length > 0) {
      await dbQuery('ROLLBACK');
      throw new Error(`Course status already exists for course ID ${courseID} and academic year ID ${activeAcademicYearID}`);
    }

    await dbQuery(`
      INSERT INTO course_status (course_id, academic_year_id, slots, status)
      VALUES ($1, $2, $3, $4);
    `, [courseID, activeAcademicYearID, slots, defaultStatus]);

    await dbQuery(`
      UPDATE course_status
      SET status = 'INACTIVE'
      WHERE course_id = $1
      AND academic_year_id != $2;
    `, [courseID, activeAcademicYearID]);
      
    await dbQuery('COMMIT');

  } catch (error) {
    await dbQuery('ROLLBACK');

    if (isDatabaseError(error) && error.code === '23505') {
      throw new Error(`Course status already exists`);
    }

    throw error;
  }
}




export async function getCoursesPaged(limit: number, offset: number) {
  const courses = await dbQuery(`
    SELECT 
      c.course_id,
      c.course_name,
      cs.course_status_id,  -- Include the course_status_id in the select statement
      cs.slots
    FROM courses c
    LEFT JOIN course_status cs 
      ON c.course_id = cs.course_id
    LEFT JOIN academic_year ay 
      ON cs.academic_year_id = ay.academic_year_id
    WHERE ay.active = TRUE OR cs.academic_year_id IS NULL
    ORDER BY c.course_name ASC
    LIMIT $1 OFFSET $2;
  `, [limit, offset]);

  const total = await dbQuery(`
    SELECT COUNT(*) 
    FROM courses c
    LEFT JOIN course_status cs 
      ON c.course_id = cs.course_id
    LEFT JOIN academic_year ay 
      ON cs.academic_year_id = ay.academic_year_id
    WHERE ay.active = TRUE OR cs.academic_year_id IS NULL;
  `);
  
  return { courses, total };
}



export async function getCourseStatus() {
  const result = await dbQuery(`
    WITH active_academic_year AS (
      SELECT academic_year_id
      FROM academic_year
      WHERE active = TRUE
      LIMIT 1
    )
    SELECT c.course_id, c.course_name
    FROM courses c
    LEFT JOIN course_status cs
      ON c.course_id = cs.course_id
      AND cs.academic_year_id = (SELECT academic_year_id FROM active_academic_year)
    WHERE cs.course_status_id IS NULL;
  `);

  return result.rows;
}

export async function getActiveCourses() {
  const activeCourses = await dbQuery(`
    SELECT 
      c.course_id,
      c.course_name,
      cs.course_status_id,
      cs.slots
    FROM courses c
    JOIN course_status cs 
      ON c.course_id = cs.course_id
    JOIN academic_year ay 
      ON cs.academic_year_id = ay.academic_year_id
    WHERE ay.active = TRUE
    ORDER BY c.course_name ASC;
  `);

  return activeCourses.rows;
}


export async function updateCourse(courseID: number, courseName: string, slots: number) {
  try {
    await dbQuery('BEGIN');

    const courseUpdateResult = await dbQuery(`
      UPDATE courses 
      SET course_name = $2 
      WHERE course_id = $1
      RETURNING *;
    `, [courseID, courseName]);

    if (courseUpdateResult.rowCount === 0) {
      throw new Error('Course not found');
    }

    const courseStatusUpdateResult = await dbQuery(`
      UPDATE course_status 
      SET slots = $2
      WHERE course_id = $1 
      AND academic_year_id = (
        SELECT academic_year_id 
        FROM academic_year 
        WHERE active = TRUE
        LIMIT 1
      )
      RETURNING *;
    `, [courseID, slots]);

    if (courseStatusUpdateResult.rowCount === 0) {
      throw new Error('No course status found for the active academic year');
    }

    await dbQuery('COMMIT');

    return { courseUpdateResult, courseStatusUpdateResult };
  } catch (error) {
    await dbQuery('ROLLBACK');
    throw error;
  }
}



export async function deleteCourse(courseID: number) {
  try {
    await dbQuery('BEGIN');

    await dbQuery(`
      DELETE FROM course_status 
      WHERE course_id = $1
    `, [courseID]);

    const result = await dbQuery(`
      DELETE FROM courses 
      WHERE course_id = $1
      RETURNING *;
    `, [courseID]);

    if (result.rowCount === 0) {
      throw new Error('Course not found');
    }

    await dbQuery('COMMIT');
    return result;
  } catch (error) {
    await dbQuery('ROLLBACK');
    throw error;
  }
}
