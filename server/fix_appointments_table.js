import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function fixTable() {
  const client = await pool.connect();
  try {
    console.log("Fixing all legacy column constraints on appointments table...");
    await client.query(`
      ALTER TABLE appointments 
      ALTER COLUMN phone DROP NOT NULL,
      ALTER COLUMN department DROP NOT NULL,
      ALTER COLUMN appointment_date DROP NOT NULL;
    `);

    console.log("✅ All constraints updated!");
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("Fix Error:", err);
    process.exit(1);
  }
}

fixTable();
