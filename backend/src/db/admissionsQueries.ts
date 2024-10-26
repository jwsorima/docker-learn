import { dbQuery } from './index.js'

export async function getAdmissionsPaged(limit: number, offset: number) {
  const admissionsQuery = `
    SELECT 
      ar.admission_record_id,
      ar.type,
      ar.created_at,
      c.course_name,
      ay.year_range AS academic_year
    FROM admission_records ar
    INNER JOIN course_status cs ON ar.course_status_id = cs.course_status_id
    INNER JOIN courses c ON cs.course_id = c.course_id
    INNER JOIN academic_year ay ON cs.academic_year_id = ay.academic_year_id
    ORDER BY ar.created_at DESC
    LIMIT $1 OFFSET $2;
  `;

  const totalCountQuery = `
    SELECT COUNT(*) AS total_count
    FROM admission_records ar
    INNER JOIN course_status cs ON ar.course_status_id = cs.course_status_id
    INNER JOIN courses c ON cs.course_id = c.course_id
    INNER JOIN academic_year ay ON cs.academic_year_id = ay.academic_year_id;
  `;

  try {
    const admissionsResult = await dbQuery(admissionsQuery, [limit, offset]);
    const totalCountResult = await dbQuery(totalCountQuery);

    return {
      admissions: admissionsResult.rows,
      total: parseInt(totalCountResult.rows[0].total_count, 10),
    };
  } catch (error) {
    console.error('Error fetching admissions:', error);
    throw new Error('Failed to fetch admissions.');
  }
}


export async function getPagedApplicationOfAdmission(admission_record_id: number, limit: number, offset: number) {
  const applicationsQuery = `
    SELECT 
      a.application_id,
      ap.full_name,
      a.application_date,
      ap.email,
      ap.address,
      ap.contact_number,
      ap.sex,
      ap.birthdate
    FROM applications a
    INNER JOIN admission_records ar ON a.admission_record_id = ar.admission_record_id
    INNER JOIN applicants ap ON a.applicant_id = ap.applicant_id
    WHERE ar.admission_record_id = $1
    ORDER BY a.application_date DESC
    LIMIT $2 OFFSET $3;
  `;

  const totalQuery = `
    SELECT COUNT(*) AS total
    FROM applications a
    INNER JOIN admission_records ar ON a.admission_record_id = ar.admission_record_id
    WHERE ar.admission_record_id = $1;
  `;

  try {
    const applicationsResult = await dbQuery(applicationsQuery, [admission_record_id, limit, offset]);
    const totalResult = await dbQuery(totalQuery, [admission_record_id]);

    return {
      applications: applicationsResult.rows,
      total: parseInt(totalResult.rows[0].total, 10),
    };
  } catch (error) {
    console.error('Error fetching paged applications:', error);
    throw new Error('Failed to fetch paged applications.');
  }
}

