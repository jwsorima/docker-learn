import { dbQuery } from './index.js';
import argon2 from 'argon2';

export type Staff = {
  staff_id?: string;
  full_name: string;
  sex: string;
  email: string;
  password: string;
}

const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL;
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;

export async function getStaffsPaged(limit: number, offset: number) {
  const staffsQuery = `
    SELECT 
      staff_id,
      full_name,
      email,
      sex
    FROM staffs
    ORDER BY full_name DESC
    LIMIT $1 OFFSET $2;
  `;

  const totalCountQuery = `
    SELECT COUNT(*) AS total_count
    FROM staffs;
  `;

  try {
    const staffsResult = await dbQuery(staffsQuery, [limit, offset]);
    const totalCountResult = await dbQuery(totalCountQuery);

    return {
      staffs: staffsResult.rows,
      total: parseInt(totalCountResult.rows[0].total_count, 10),
    };
  } catch (error) {
    console.error('Error fetching staffs:', error);
    throw new Error('Failed to fetch staffs.');
  }
}

export async function createStaff(s: Staff) {
  try {
    await dbQuery('BEGIN');

    const result = await dbQuery(`
      INSERT INTO staffs (full_name, sex, email, password)
      VALUES ($1, $2, $3, $4)
    `, [s.full_name, s.sex, s.email, s.password]);

    await dbQuery('COMMIT');

    return result.rows[0];
  } catch (error) {
    await dbQuery('ROLLBACK');

    if (error instanceof Error && (error as any).code === '23505') {  // PostgreSQL UNIQUE violation error code
      throw new Error('Email already exists');
    }

    console.error('Error creating staff:', error);
    throw new Error('Failed to create staff.');
  }
}

export async function updateStaff(s: Staff) {
  try {
    let result;

    if (s.password !== "") {
      result = await dbQuery(
        `
        UPDATE staffs
        SET 
          full_name = $1,
          sex = $2,
          email = $3,
          password = $4
        WHERE staff_id = $5;
        `,
        [s.full_name, s.sex, s.email, s.password, s.staff_id]
      );
    } else {
      // If no password is provided, don't update it
      result = await dbQuery(
        `
        UPDATE staffs
        SET 
          full_name = $1,
          sex = $2,
          email = $3
        WHERE staff_id = $4;
        `,
        [s.full_name, s.sex, s.email, s.staff_id]
      );
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error updating staff:', error);
    throw new Error('Failed to update staff.');
  }
}

export async function deleteStaff(staff_id: number) {
  try {
    const result = await dbQuery(`
      DELETE FROM staffs
      WHERE staff_id = $1;
    `, [staff_id]);

    if (result.rowCount === 0) {
      throw new Error(`Staff with ID ${staff_id} not found.`);
    }

    return result.rows[0];
  } catch (error) {
    console.error('Error deleting staff:', error);
    throw new Error('Failed to delete staff.');
  }
}

export async function getDashboardStats() {
  const dashboardQuery = `
    WITH 
    total_applicants AS (
      SELECT COUNT(*) AS total_applicants FROM applicants
    ),
    active_courses AS (
      SELECT COUNT(*) AS active_courses FROM course_status WHERE status = 'Active'
    ),
    total_admissions AS (
      SELECT COUNT(*) AS total_admissions FROM admission_records
    ),
    total_staff AS (
      SELECT COUNT(*) AS total_staff FROM staffs
    ),
    recent_applications AS (
      SELECT DISTINCT ON (a.application_id) 
        a.application_id, 
        ap.full_name, 
        c.course_name, 
        a.application_status
      FROM applications a
      INNER JOIN applicants ap ON a.applicant_id = ap.applicant_id
      INNER JOIN course_status cs ON a.course_status_id = cs.course_status_id
      INNER JOIN courses c ON cs.course_id = c.course_id
      ORDER BY a.application_id, a.application_date DESC
      LIMIT 5
    ),
    available_courses AS (
      SELECT DISTINCT cs.course_status_id, c.course_name, ay.year_range, cs.slots
      FROM course_status cs
      INNER JOIN courses c ON cs.course_id = c.course_id
      INNER JOIN academic_year ay ON cs.academic_year_id = ay.academic_year_id
      WHERE cs.slots > 0 AND cs.status = 'Active'
    ),
    admission_lists AS (
      SELECT DISTINCT ON (ar.admission_record_id)
        ar.admission_record_id, 
        c.course_name, 
        ar.type, 
        ar.created_at
      FROM admission_records ar
      INNER JOIN course_status cs ON ar.course_status_id = cs.course_status_id
      INNER JOIN courses c ON cs.course_id = c.course_id
      ORDER BY ar.admission_record_id, ar.created_at DESC
      LIMIT 5
    )
    SELECT 
      (SELECT total_applicants FROM total_applicants),
      (SELECT active_courses FROM active_courses),
      (SELECT total_admissions FROM total_admissions),
      (SELECT total_staff FROM total_staff),
      COALESCE(json_agg(DISTINCT recent_applications.*) FILTER (WHERE recent_applications.application_id IS NOT NULL), '[]') AS recent_applications,
      COALESCE(json_agg(DISTINCT available_courses.*) FILTER (WHERE available_courses.course_status_id IS NOT NULL), '[]') AS available_courses,
      COALESCE(json_agg(DISTINCT admission_lists.*) FILTER (WHERE admission_lists.admission_record_id IS NOT NULL), '[]') AS admission_lists
    FROM recent_applications, available_courses, admission_lists
    LIMIT 1;
  `;

  try {
    const result = await dbQuery(dashboardQuery);
    return result.rows[0];
  } catch (error) {
    console.error('Error fetching dashboard stats:', error);
    throw new Error('Failed to fetch dashboard stats.');
  }
}

export async function loginStaff(email: string, password: string) {
  try {
    if (email === SUPER_ADMIN_EMAIL) {
      // Compare the plain-text passwords directly
      if (password === SUPER_ADMIN_PASSWORD) {
        return {
          staff_id: 'super_admin',
          email: SUPER_ADMIN_EMAIL,
          role: 'super_admin',
        };
      } else {
        return null;
      }
    }

    const result = await dbQuery(`
      SELECT staff_id, password, email
      FROM staffs
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    const staff = result.rows[0];

    const isPasswordValid = await argon2.verify(staff.password, password);

    if (isPasswordValid) {
      return {
        staff_id: staff.staff_id,
        email: staff.email,
        role: 'staff'
      };
    }

    return null;

  } catch (error) {
    console.error('Error verifying staff login credentials:', error);
    throw new Error('Staff login verification failed.');
  }
}