import { dbQuery } from './index.js'

export async function createApplication(applicant_id: number, course_id: number, document_one_ext: string, document_two_ext: string) {
  try {
    await dbQuery('BEGIN');

    const activeYearResult = await dbQuery(`
      SELECT academic_year_id
      FROM academic_year
      WHERE active = TRUE
      LIMIT 1;
    `);

    if (activeYearResult.rows.length === 0) {
      throw new Error('No active academic year found.');
    }

    const active_academic_year_id = activeYearResult.rows[0].academic_year_id;

    const courseStatusResult = await dbQuery(`
      SELECT cs.course_status_id
      FROM course_status cs
      WHERE cs.course_id = $1
      AND cs.academic_year_id = $2
      LIMIT 1;
    `, [course_id, active_academic_year_id]);

    if (courseStatusResult.rows.length === 0) {
      throw new Error(`No course status found for course ID ${course_id} in the current academic year.`);
    }

    const course_status_id = courseStatusResult.rows[0].course_status_id;

    await dbQuery(`
      INSERT INTO applications (applicant_id, course_status_id, application_status, application_date, document_one_ext, document_two_ext)
      VALUES ($1, $2, 'Pending', CURRENT_DATE, $3, $4);
    `, [applicant_id, course_status_id, document_one_ext, document_two_ext]);

    await dbQuery('COMMIT');
    
    return { success: true, message: 'Application created successfully.' };
  } catch (error) {
    await dbQuery('ROLLBACK');
    throw error;
  }
}


export async function checkApplicationExist(applicantID: number) {
  const result = await dbQuery(`
    SELECT 
      a.application_id,
      a.application_status,
      a.application_date,
      c.course_name
    FROM applications a
    INNER JOIN course_status cs ON a.course_status_id = cs.course_status_id
    INNER JOIN courses c ON cs.course_id = c.course_id
    WHERE a.applicant_id = $1
    LIMIT 1;
  `, [applicantID]);

  if (result.rows.length > 0) {
    return {
      exists: true,
      application: result.rows[0],
    };
  }

  return { exists: false, application: null };
}

export async function getApplication(applicantId: number) {
  return await dbQuery(`
    SELECT 
      a.application_id,
      a.application_status,
      a.application_date,
      a.schedule_start,
      a.schedule_end,
      a.remarks,
      c.course_name,
      ay.year_range AS academic_year
    FROM applications a
    INNER JOIN course_status cs ON a.course_status_id = cs.course_status_id
    INNER JOIN courses c ON cs.course_id = c.course_id
    INNER JOIN academic_year ay ON cs.academic_year_id = ay.academic_year_id
    WHERE a.applicant_id = $1
    ORDER BY a.application_date DESC
    LIMIT 1;
  `, [applicantId]);
}



export async function getApplicationsPaged(course_status_id: number, limit: number, offset: number) {
  const applications = await dbQuery(`
    SELECT 
      a.application_id,
      a.applicant_id,
      ap.full_name,
      a.application_status,
      a.application_date,
      a.remarks,
      a.schedule_start,
      a.schedule_end,
      a.document_one_ext,
      a.document_two_ext
    FROM applications a
    INNER JOIN applicants ap ON a.applicant_id = ap.applicant_id
    WHERE a.course_status_id = $1
    ORDER BY a.application_date DESC
    LIMIT $2 OFFSET $3;
  `, [course_status_id, limit, offset]);

  const total = await dbQuery(`
    SELECT COUNT(*) FROM applications a
    WHERE a.course_status_id = $1
  `, [course_status_id]);

  return { applications: applications.rows, total: total.rows[0].count };
}

export async function getScheduledApplicationsPaged(course_status_id: number, limit: number, offset: number, status: 'Scheduled' | 'Pending') {
  const applications = await dbQuery(`
    SELECT 
      a.application_id,
      a.applicant_id,
      ap.full_name,
      a.application_status,
      a.application_date,
      a.remarks,
      a.schedule_start,
      a.schedule_end,
      a.document_one_ext,
      a.document_two_ext
    FROM applications a
    INNER JOIN applicants ap ON a.applicant_id = ap.applicant_id
    WHERE a.course_status_id = $1
      AND a.application_status = $2  -- Use status directly
    ORDER BY a.application_date DESC
    LIMIT $3 OFFSET $4;  -- Adjusted order of parameters
  `, [course_status_id, status, limit, offset]);

  const total = await dbQuery(`
    SELECT COUNT(*) FROM applications a
    WHERE a.course_status_id = $1
      AND a.application_status = $2  -- Use status directly
  `, [course_status_id, status]);

  return { applications: applications.rows, total: parseInt(total.rows[0].count, 10) };
}


export async function updateRemarks(applicationID: number, remarks: string) {
  try {
    const result = await dbQuery(`
      UPDATE applications 
      SET remarks = $2
      WHERE application_id = $1
    `, [applicationID, remarks]);

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error updating remarks:', error);
    throw new Error('Failed to update remarks');
  }
}

export async function updateSchedule(applicationID: number, start: Date, end: Date) {
  try {
    const result = await dbQuery(`
      UPDATE applications 
      SET schedule_start = $1, schedule_end = $2, application_status = 'Scheduled'
      WHERE application_id = $3
    `, [start, end, applicationID]);

    return (result.rowCount ?? 0) > 0;
  } catch (error) {
    console.error('Error updating schedule:', error);
    throw new Error('Failed to update schedule');
  }
}

export async function createApplicationList(application_ids: number[], status: 'Passed' | 'NotPassed' | 'NoShow', course_status_id: number) {
  try {
    await dbQuery('BEGIN');

    const admissionRecordResult = await dbQuery(`
      INSERT INTO admission_records (course_status_id, type)
      VALUES ($1, $2)
      RETURNING admission_record_id;
    `, [course_status_id, status]);

    const admission_record_id = admissionRecordResult.rows[0].admission_record_id;

    // Construct placeholders for each application_id to be used in the WHERE clause.
    // The placeholders start at $3 because:
    // - $1 is reserved for the 'status' value
    // - $2 is reserved for the 'admission_record_id' value
    // - The application_ids array elements start from $3 onwards
    const placeholders = application_ids.map((_, idx) => `$${idx + 3}`).join(', ');

    await dbQuery(`
      UPDATE applications
      SET application_status = $1, admission_record_id = $2
      WHERE application_id IN (${placeholders});
    `, [status, admission_record_id, ...application_ids]);

    await dbQuery('COMMIT');

    return { success: true, message: 'Applications updated successfully.' };
  } catch (error) {
    await dbQuery('ROLLBACK');
    console.error('Error creating application list:', error);
    throw new Error('Failed to create application list');
  }
}

export async function getApplicationsForDownload(admission_record_id: number) {
  const query = `
    SELECT 
      a.application_id,
      ap.full_name,
      a.application_date,
      ap.email,
      ap.address,
      ap.contact_number,
      ap.sex,
      ap.birthdate,
      c.course_name, 
      ay.year_range AS academic_year,
      ar.type
    FROM applications a
    INNER JOIN admission_records ar ON a.admission_record_id = ar.admission_record_id
    INNER JOIN course_status cs ON ar.course_status_id = cs.course_status_id
    INNER JOIN courses c ON cs.course_id = c.course_id
    INNER JOIN academic_year ay ON cs.academic_year_id = ay.academic_year_id
    INNER JOIN applicants ap ON a.applicant_id = ap.applicant_id
    WHERE ar.admission_record_id = $1
    ORDER BY a.application_date DESC;
  `;

  try {
    const result = await dbQuery(query, [admission_record_id]);
    return result.rows;
  } catch (error) {
    console.error('Error fetching applications for download:', error);
    throw new Error('Failed to fetch applications for download.');
  }
}