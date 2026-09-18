import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}
const pool = new pg.Pool({ connectionString });

async function checkUsers() {
  const res = await pool.query(`SELECT id, email, role, status FROM users`);
  console.log('USERS IN DB:', res.rows);
  await pool.end();
}
checkUsers();
