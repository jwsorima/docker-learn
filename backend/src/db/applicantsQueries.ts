import { escapeHtml } from '../helpers/stringHelper.js';
import { dbQuery } from './index.js'
import argon2 from 'argon2';


export type Applicant = {
  fullName: string;
  address: string;
  contactNumber: string;
  sex: string;
  birthdate: string;
  email: string;
  password: string;
}

export async function checkEmailExists(email: string) {
  return await dbQuery(`
    SELECT 1 FROM applicants WHERE email = $1 LIMIT 1
  `, [email]);
}

export async function createApplicant(a: Applicant) {
  try {
    await dbQuery('BEGIN');

    const insertResult = await dbQuery(`
      INSERT INTO applicants (
        full_name, address, contact_number, email, sex, password, birthdate
      ) VALUES ($1, $2, $3, $4, $5, $6, $7) 
      RETURNING applicant_id, full_name, email
    `, [a.fullName, escapeHtml(a.address), a.contactNumber, a.email, a.sex, a.password, a.birthdate
    ]);
    
    await dbQuery('COMMIT');

    return insertResult.rows[0];
  } catch (error) {
    await dbQuery('ROLLBACK');
    throw error;
  }
}

export async function loginApplicant(email: string, password: string) {
  try {
    const result = await dbQuery(`
      SELECT applicant_id, password, email
      FROM applicants
      WHERE email = $1
    `, [email]);

    if (result.rows.length === 0) {
      return null;
    }

    const applicant = result.rows[0];

    const isPasswordValid = await argon2.verify(applicant.password, password);

    if (isPasswordValid) {
      return {
        applicant_id: applicant.applicant_id,
        email: applicant.email,
      };
    }

    return null;

  } catch (error) {
    console.error('Error verifying login credentials:', error);
    throw new Error('Login verification failed.');
  }
}

export async function getApplicant(id: number) {
  return await dbQuery(`
    SELECT 
      applicant_id, 
      full_name, 
      address, 
      contact_number, 
      email, 
      sex, 
      birthdate
    FROM 
      applicants
    WHERE 
      applicant_id = $1;
  `, [id])
}

export async function getApplicantsPaged(limit: number, offset: number) {
  const applicants = await dbQuery(`
    SELECT 
      applicant_id,
      full_name,
      address,
      contact_number,
      email,
      sex,
      birthdate
    FROM applicants
    ORDER BY full_name ASC
    LIMIT $1 OFFSET $2;
  `, [limit, offset]);

  const total = await dbQuery(`
    SELECT COUNT(*) FROM applicants;
  `);

  return { applicants: applicants.rows, total: total.rows[0].count };
}
