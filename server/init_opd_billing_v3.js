import { pool } from './config/db.js';

async function initOpdBilling() {
  console.log('🚀 INITIALIZING OPD CONSULTATION, BILLING & HOSPITAL SETTINGS TABLES...\n');
  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // 1. Add checked_in_at column to appointments table
    console.log('1️⃣ Checking checked_in_at column on appointments table...');
    await client.query(`
      ALTER TABLE appointments 
      ADD COLUMN IF NOT EXISTS checked_in_at TIMESTAMP NULL;
    `);

    // 2. Create prescriptions table
    console.log('2️⃣ Creating prescriptions table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS prescriptions (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) DEFAULT 'GJS-HOSP-01',
        appointment_id INTEGER UNIQUE REFERENCES appointments(id) ON DELETE CASCADE,
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        doctor_id INTEGER REFERENCES doctors(id) ON DELETE CASCADE,
        diagnosis TEXT,
        notes TEXT,
        follow_up_date DATE,
        pdf_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 3. Create prescription_medicines table
    console.log('3️⃣ Creating prescription_medicines table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS prescription_medicines (
        id SERIAL PRIMARY KEY,
        prescription_id INTEGER REFERENCES prescriptions(id) ON DELETE CASCADE,
        name VARCHAR(255) NOT NULL,
        dosage VARCHAR(100),
        duration VARCHAR(100),
        instructions TEXT
      );
    `);

    // 4. Create bills table
    console.log('4️⃣ Creating bills table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bills (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) DEFAULT 'GJS-HOSP-01',
        patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
        appointment_id INTEGER UNIQUE REFERENCES appointments(id) ON DELETE SET NULL,
        prescription_id INTEGER UNIQUE REFERENCES prescriptions(id) ON DELETE SET NULL,
        bill_number VARCHAR(100) UNIQUE NOT NULL,
        status VARCHAR(50) DEFAULT 'PENDING',
        total_amount NUMERIC(10, 2) DEFAULT 0.00,
        paid_amount NUMERIC(10, 2) DEFAULT 0.00,
        payment_method VARCHAR(50),
        pdf_url VARCHAR(255),
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // 5. Create bill_items table
    console.log('5️⃣ Creating bill_items table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS bill_items (
        id SERIAL PRIMARY KEY,
        bill_id INTEGER REFERENCES bills(id) ON DELETE CASCADE,
        category VARCHAR(50) NOT NULL,
        description TEXT NOT NULL,
        amount NUMERIC(10, 2) NOT NULL,
        quantity INTEGER DEFAULT 1
      );
    `);

    // 6. Create hospital_settings table
    console.log('6️⃣ Creating hospital_settings table...');
    await client.query(`
      CREATE TABLE IF NOT EXISTS hospital_settings (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) UNIQUE DEFAULT 'GJS-HOSP-01',
        hospital_name VARCHAR(255) DEFAULT 'G.J.S Multi-Speciality Hospital',
        phone VARCHAR(50) DEFAULT '+91 94431 23456',
        address TEXT DEFAULT '123 Hospital Road, City Center',
        language_preference VARCHAR(10) DEFAULT 'en',
        updated_at TIMESTAMP DEFAULT NOW()
      );
    `);

    // Insert default hospital settings if not exists
    await client.query(`
      INSERT INTO hospital_settings (hospital_id, hospital_name, phone, address, language_preference)
      VALUES ('GJS-HOSP-01', 'G.J.S Multi-Speciality Hospital', '+91 94431 23456', '123 Hospital Road, City Center', 'en')
      ON CONFLICT (hospital_id) DO NOTHING;
    `);

    await client.query('COMMIT');
    console.log('\n✅ OPD CONSULTATION, BILLING & SETTINGS MIGRATIONS COMPLETED SUCCESSFULLY!');
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ MIGRATION ERROR:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

initOpdBilling();
