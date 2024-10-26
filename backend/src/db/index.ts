import pg from 'pg';
const { Pool } = pg;

export const pool = new Pool({
  user: process.env.DEV_DB_USER,
  password: process.env.DEV_DB_PASSWORD,
  host: process.env.DEV_DB_HOST,
  port: parseInt(process.env.DEV_DB_PORT as string, 10),
  database: process.env.DEV_DB_NAME
});

export const dbQuery = async (text: string, params?: any[]) => {
  const client = await pool.connect();  // Get a new client connection from the pool
  try {
    await client.query(`SET TIME ZONE 'UTC';`);  // Set the time zone to UTC for this session
    const result = await client.query(text, params);  // Execute the query with provided parameters
    return result;  // Return the result of the query
  } catch (e) {
    await client.query('ROLLBACK');
    throw e
  } finally {
    client.release();  // Release the client connection back to the pool
  }
};

// CREATE DATABASE admission_management_system WITH OWNER = admin;

const initializeDatabase = async () => {
  const createTablesQuery = `
    CREATE TABLE IF NOT EXISTS applicants (
      applicant_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      address TEXT NOT NULL,
      contact_number VARCHAR(20),
      email VARCHAR(255) UNIQUE NOT NULL,
      sex VARCHAR(10) NOT NULL,
      password TEXT NOT NULL,
      birthdate DATE NOT NULL
    );

    CREATE TABLE IF NOT EXISTS courses (
      course_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      course_name VARCHAR(255) NOT NULL
    );

    CREATE TABLE IF NOT EXISTS academic_year (
      academic_year_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      year_range VARCHAR(20) NOT NULL,
      active BOOLEAN NOT NULL DEFAULT TRUE,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS course_status (
      course_status_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      course_id INT NOT NULL,
      academic_year_id INT NOT NULL,
      slots INT NOT NULL CHECK (slots >= 0),
      status VARCHAR(50) NOT NULL,
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_course FOREIGN KEY (course_id) REFERENCES courses(course_id),
      CONSTRAINT fk_academic_year FOREIGN KEY (academic_year_id) REFERENCES academic_year(academic_year_id),
      CONSTRAINT unique_course_status_per_year UNIQUE (course_id, academic_year_id)
    );

    -- Create trigger function for updating the 'updated_at' column in course_status
    CREATE OR REPLACE FUNCTION update_course_status_updated_at_column()
    RETURNS TRIGGER AS $$
    BEGIN
      NEW.updated_at = NOW();
      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;

    -- Create trigger for updating the 'updated_at' column in course_status
    CREATE OR REPLACE TRIGGER update_course_status_updated_at
    BEFORE UPDATE ON course_status
    FOR EACH ROW
    EXECUTE FUNCTION update_course_status_updated_at_column();


    CREATE TABLE IF NOT EXISTS admission_records (
      admission_record_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      course_status_id INT NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('Passed', 'NotPassed', 'NoShow')),
      created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_course_status FOREIGN KEY (course_status_id) REFERENCES course_status(course_status_id)
    );

    CREATE TABLE IF NOT EXISTS applications (
      application_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      applicant_id INT NOT NULL,
      course_status_id INT NOT NULL,
      admission_record_id INT,
      application_status VARCHAR(50) NOT NULL DEFAULT 'Pending',
      application_date DATE NOT NULL DEFAULT CURRENT_DATE,
      remarks VARCHAR,
      schedule_start TIMESTAMPTZ,
      schedule_end TIMESTAMPTZ,
      document_one_ext VARCHAR(10),
      document_two_ext VARCHAR(10),
      CONSTRAINT fk_applicant FOREIGN KEY (applicant_id) REFERENCES applicants(applicant_id),
      CONSTRAINT fk_course_status FOREIGN KEY (course_status_id) REFERENCES course_status(course_status_id),
      CONSTRAINT fk_admission_record FOREIGN KEY (admission_record_id) REFERENCES admission_records(admission_record_id)
    );

    CREATE TABLE IF NOT EXISTS staffs (
      staff_id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      sex VARCHAR(10) NOT NULL,
      email VARCHAR(255) NOT NULL UNIQUE,
      password VARCHAR(255) NOT NULL
    );
  `;

  try {
    await dbQuery(createTablesQuery);
  } catch (error) {
    console.error('Error initializing database:', error);
  }
};

initializeDatabase();