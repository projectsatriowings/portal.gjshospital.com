import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}
const pool = new pg.Pool({ connectionString });

async function initPatientAndDoctorTables() {
  const client = await pool.connect();
  try {
    console.log('🔄 Initializing Patient & Doctor Dashboard DB tables...');

    // 1. Patients Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS patients (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) DEFAULT 'GJS-HOSP-01',
        uhid VARCHAR(50) UNIQUE NOT NULL,
        name VARCHAR(255) NOT NULL,
        mobile VARCHAR(50) NOT NULL,
        email VARCHAR(255),
        age INTEGER,
        dob DATE,
        gender VARCHAR(20),
        blood_group VARCHAR(20),
        address TEXT,
        govt_id_number VARCHAR(100),
        emergency_contact_name VARCHAR(255),
        emergency_contact_phone VARCHAR(50),
        allergies TEXT,
        existing_diseases TEXT,
        insurance_provider VARCHAR(255),
        insurance_policy_number VARCHAR(100),
        photo_url TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_hospital_mobile UNIQUE (hospital_id, mobile)
      );
    `);
    console.log('✅ Patients table initialized!');

    // 2. Add patient_id to appointments table if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='appointments' AND column_name='patient_id'
        ) THEN
          ALTER TABLE appointments ADD COLUMN patient_id INTEGER REFERENCES patients(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Appointments table updated with patient_id column!');

    // 3. Add user_id to doctors table if not exists
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='doctors' AND column_name='user_id'
        ) THEN
          ALTER TABLE doctors ADD COLUMN user_id INTEGER REFERENCES users(id) ON DELETE SET NULL;
        END IF;
      END $$;
    `);
    console.log('✅ Doctors table updated with user_id column!');

    // 4. Doctor Unavailability / Leave Table
    await client.query(`
      CREATE TABLE IF NOT EXISTS doctor_unavailability (
        id SERIAL PRIMARY KEY,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        blocked_date DATE NOT NULL,
        blocked_time_slot VARCHAR(50),
        reason TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Doctor Unavailability table initialized!');

  } catch (err) {
    console.error('❌ Error initializing Patient and Doctor tables:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

initPatientAndDoctorTables();
