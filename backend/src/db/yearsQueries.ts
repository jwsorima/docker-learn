import { dbQuery } from './index.js';

export async function createAcademicYear(yearRange: string, active: boolean) {
  try {
    await dbQuery('BEGIN');

    if (active) {
      await dbQuery(`
        UPDATE academic_year
        SET active = false
      `);
    }

    const insertResult = await dbQuery(`
      INSERT INTO academic_year (year_range, active)
      VALUES ($1, $2)
      RETURNING *;
    `, [yearRange, active]);

    await dbQuery('COMMIT');

    return insertResult.rows[0];

  } catch (error) {
    await dbQuery('ROLLBACK');
    throw error;
  }
}


export async function getAcademicYearsPaged(limit: number, offset: number) {
  const academicYears = await dbQuery(`
    SELECT * FROM academic_year
    ORDER BY year_range DESC
    LIMIT $1 OFFSET $2;
  `, [limit, offset]);
  const total = await dbQuery(`SELECT COUNT(*) FROM academic_year`);
  return { academicYears, total };
}

export async function updateAcademicYear(academicYearID: number, yearRange: string, active: boolean) {
  try {
    await dbQuery('BEGIN');

    if (active) {
      await dbQuery(`
        UPDATE academic_year
        SET active = false;
      `);
    }

    const updateResult = await dbQuery(`
      UPDATE academic_year
      SET year_range = $2, active = $3
      WHERE academic_year_id = $1
      RETURNING *;
    `, [academicYearID, yearRange, active]);

    if (active) {
      await dbQuery(`
        UPDATE course_status
        SET status = 'Active'
        WHERE academic_year_id = $1;
      `, [academicYearID]);

      await dbQuery(`
        UPDATE course_status
        SET status = 'Inactive'
        WHERE academic_year_id != $1;
      `, [academicYearID]);
    }

    await dbQuery('COMMIT');

    return updateResult.rows[0];

  } catch (error) {
    await dbQuery('ROLLBACK');
    throw error;
  }
}



export async function deleteAcademicYear(academicYearID: number) {
  try {
    await dbQuery('BEGIN');

    await dbQuery(`
      DELETE FROM course_status
      WHERE academic_year_id = $1;
    `, [academicYearID]);

    const result = await dbQuery(`
      SELECT active 
      FROM academic_year 
      WHERE academic_year_id = $1;
    `, [academicYearID]);

    if (result.rows.length === 0) {
      throw new Error('Academic year not found');
    }

    const isActive = result.rows[0].active;

    await dbQuery(`
      DELETE FROM academic_year
      WHERE academic_year_id = $1;
    `, [academicYearID]);

    if (isActive) {
      const latestYearResult = await dbQuery(`
        SELECT academic_year_id 
        FROM academic_year
        ORDER BY academic_year_id DESC
        LIMIT 1;
      `);

      if (latestYearResult.rows.length > 0) {
        const latestAcademicYearID = latestYearResult.rows[0].academic_year_id;

        await dbQuery(`
          UPDATE academic_year
          SET active = true
          WHERE academic_year_id = $1;
        `, [latestAcademicYearID]);
      }
    }

    await dbQuery('COMMIT');
  } catch (error) {
    await dbQuery('ROLLBACK');
    throw error;
  }
}


export async function getCurrentAcademicYear() {
  const academicYear = await dbQuery(`
    SELECT academic_year_id, year_range FROM academic_year
    WHERE active = true
    LIMIT 1;
  `);

  return academicYear;
}
