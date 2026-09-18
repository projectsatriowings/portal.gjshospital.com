import pg from 'pg';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}
const pool = new pg.Pool({ connectionString });

async function seedAdminUsers() {
  const client = await pool.connect();
  try {
    console.log('🌱 Seeding initial admin & staff users...');

    // 1. Initial Super Admin
    const superAdminEmail = process.env.INITIAL_ADMIN_EMAIL || 'admin@gjshospital.com';
    const superAdminPassword = process.env.INITIAL_ADMIN_PASSWORD || 'AdminPassword123!';
    const superAdminHash = await bcrypt.hash(superAdminPassword, 10);

    await client.query(`
      INSERT INTO users (hospital_id, name, email, phone, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $5, role = $6, status = $7;
    `, ['GJS-HOSP-01', 'System Administrator', superAdminEmail, '+91 98765 43210', superAdminHash, 'SUPER_ADMIN', 'active']);

    console.log(`✅ SUPER_ADMIN user seeded: ${superAdminEmail}`);

    // 2. Initial Receptionist (for testing role-based access)
    const recepEmail = process.env.INITIAL_RECEPTIONIST_EMAIL || 'receptionist@gjshospital.com';
    const recepPassword = process.env.INITIAL_RECEPTIONIST_PASSWORD || 'ReceptionistPass123!';
    const recepHash = await bcrypt.hash(recepPassword, 10);

    await client.query(`
      INSERT INTO users (hospital_id, name, email, phone, password_hash, role, status)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (email) DO UPDATE 
      SET password_hash = $5, role = $6, status = $7;
    `, ['GJS-HOSP-01', 'Front Desk Receptionist', recepEmail, '+91 98765 43211', recepHash, 'RECEPTIONIST', 'active']);

    console.log(`✅ RECEPTIONIST user seeded: ${recepEmail}`);

  } catch (err) {
    console.error('❌ Error seeding admin users:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

seedAdminUsers();
