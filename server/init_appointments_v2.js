import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}
const pool = new pg.Pool({ connectionString });

async function initAppointmentsV2() {
  const client = await pool.connect();
  try {
    console.log('🔄 Running Appointments V2 DB Migration...');

    // 1. Add token_number column to appointments table if missing
    await client.query(`
      DO $$
      BEGIN
        IF NOT EXISTS (
          SELECT 1 FROM information_schema.columns 
          WHERE table_name='appointments' AND column_name='token_number'
        ) THEN
          ALTER TABLE appointments ADD COLUMN token_number INTEGER;
        END IF;
      END $$;
    `);
    console.log('✅ appointments table updated with token_number column!');

    // 2. Create appointment_status_logs table
    await client.query(`
      CREATE TABLE IF NOT EXISTS appointment_status_logs (
        id SERIAL PRIMARY KEY,
        appointment_id INTEGER REFERENCES appointments(id) ON DELETE CASCADE,
        previous_status VARCHAR(50),
        new_status VARCHAR(50) NOT NULL,
        changed_by_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        changed_by_name VARCHAR(255),
        reason TEXT,
        changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
    console.log('✅ appointment_status_logs table initialized!');

  } catch (err) {
    console.error('❌ Migration Error:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

initAppointmentsV2();
