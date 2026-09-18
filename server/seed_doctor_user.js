import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}
const pool = new pg.Pool({ connectionString });

async function seedDoctorLogin() {
  const client = await pool.connect();
  try {
    const docs = await client.query('SELECT id, name, specialty FROM doctors ORDER BY id ASC LIMIT 5');
    console.log('DOCTORS:', docs.rows);

    if (docs.rows.length > 0) {
      const doc = docs.rows[0];
      const email = 'doctor@gjshospital.com';
      const password = 'DoctorPass123!';
      const hash = await bcrypt.hash(password, 10);

      const u = await client.query(
        `INSERT INTO users (hospital_id, name, email, password_hash, role, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         ON CONFLICT (email) DO UPDATE SET password_hash = $4, role = $5, status = $6
         RETURNING id`,
        ['GJS-HOSP-01', doc.name, email, hash, 'DOCTOR', 'active']
      );

      const userId = u.rows[0].id;
      await client.query('UPDATE doctors SET user_id = $1 WHERE id = $2', [userId, doc.id]);

      console.log(`✅ Seeded DOCTOR user: ${email} linked to Doctor ID ${doc.id} (${doc.name})`);
    }
  } finally {
    client.release();
    await pool.end();
  }
}
seedDoctorLogin();
