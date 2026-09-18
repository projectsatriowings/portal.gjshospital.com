/**
 * IPD (In-Patient Department) + Bed Management — Database Migration
 * 
 * Creates 5 new tables: wards, beds, admissions, nursing_notes, discharge_summaries
 * Adds 1 nullable column to existing bills table: admission_id
 * 
 * Run: node init_ipd_tables.js
 */

import { pool } from './config/db.js';
import dotenv from 'dotenv';
dotenv.config();

async function initIPDTables() {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. WARDS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS wards (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) DEFAULT 'GJS-HOSP-01',
        name VARCHAR(255) NOT NULL,
        room_type VARCHAR(100) NOT NULL DEFAULT 'General',
        daily_rate NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
        total_beds INTEGER NOT NULL DEFAULT 0,
        status VARCHAR(20) NOT NULL DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "wards" created/verified.');

    // 2. BEDS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS beds (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) DEFAULT 'GJS-HOSP-01',
        ward_id INTEGER NOT NULL REFERENCES wards(id) ON DELETE CASCADE,
        bed_number VARCHAR(50) NOT NULL,
        status VARCHAR(20) NOT NULL DEFAULT 'AVAILABLE',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        CONSTRAINT unique_bed_number UNIQUE (hospital_id, bed_number)
      );
    `);
    console.log('✅ Table "beds" created/verified.');

    // 3. ADMISSIONS TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS admissions (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) DEFAULT 'GJS-HOSP-01',
        patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        bed_id INTEGER NOT NULL REFERENCES beds(id) ON DELETE RESTRICT,
        bill_id INTEGER,
        admission_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
        expected_discharge_date DATE,
        actual_discharge_date TIMESTAMP,
        admission_reason TEXT,
        status VARCHAR(20) NOT NULL DEFAULT 'ADMITTED',
        created_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "admissions" created/verified.');

    // 4. NURSING NOTES TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS nursing_notes (
        id SERIAL PRIMARY KEY,
        admission_id INTEGER NOT NULL REFERENCES admissions(id) ON DELETE CASCADE,
        recorded_by INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        note_type VARCHAR(30) NOT NULL DEFAULT 'GENERAL_NOTE',
        vitals JSONB,
        note TEXT,
        recorded_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "nursing_notes" created/verified.');

    // 5. DISCHARGE SUMMARIES TABLE
    await client.query(`
      CREATE TABLE IF NOT EXISTS discharge_summaries (
        id SERIAL PRIMARY KEY,
        admission_id INTEGER NOT NULL UNIQUE REFERENCES admissions(id) ON DELETE CASCADE,
        discharged_by INTEGER NOT NULL REFERENCES doctors(id) ON DELETE CASCADE,
        diagnosis TEXT,
        treatment_summary TEXT,
        discharge_instructions TEXT,
        follow_up_date DATE,
        pdf_url VARCHAR(500),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ Table "discharge_summaries" created/verified.');

    // 6. ADDITIVE COLUMN on existing bills table (nullable — does NOT break OPD bills)
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns
          WHERE table_name = 'bills' AND column_name = 'admission_id'
        ) THEN
          ALTER TABLE bills ADD COLUMN admission_id INTEGER REFERENCES admissions(id) ON DELETE SET NULL;
        END IF;
      END
      $$;
    `);
    console.log('✅ Column "admission_id" added to "bills" table (nullable, additive only).');

    // Create indexes for performance
    await client.query(`CREATE INDEX IF NOT EXISTS idx_beds_ward_id ON beds(ward_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_beds_status ON beds(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admissions_patient_id ON admissions(patient_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admissions_doctor_id ON admissions(doctor_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admissions_bed_id ON admissions(bed_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_admissions_status ON admissions(status);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_nursing_notes_admission_id ON nursing_notes(admission_id);`);
    await client.query(`CREATE INDEX IF NOT EXISTS idx_bills_admission_id ON bills(admission_id);`);
    console.log('✅ Indexes created.');

    await client.query('COMMIT');
    console.log('\n🎉 IPD tables migration completed successfully!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ IPD migration failed:', err);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

initIPDTables().catch(err => {
  console.error('Fatal migration error:', err);
  process.exit(1);
});
