import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}
const pool = new pg.Pool({ connectionString });
const r = await pool.query("SELECT id, name, user_id FROM doctors WHERE user_id IS NOT NULL LIMIT 10");
r.rows.forEach(d => console.log('doctor.id:', d.id, '| user_id:', d.user_id, '| name:', d.name));
// Also check admin user
const u = await pool.query("SELECT id, email, role FROM users WHERE role IN ('SUPER_ADMIN','HOSPITAL_ADMIN') LIMIT 5");
u.rows.forEach(d => console.log('admin user.id:', d.id, '| email:', d.email, '| role:', d.role));
await pool.end();
