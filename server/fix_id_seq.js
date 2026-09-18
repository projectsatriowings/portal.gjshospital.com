import { pool } from './config/db.js';

async function fixSeq() {
  try {
    console.log('Fixing departments id sequence in Neon Cloud DB...');
    await pool.query(`
      CREATE SEQUENCE IF NOT EXISTS departments_id_seq;
      SELECT setval('departments_id_seq', COALESCE((SELECT MAX(id) FROM departments), 0));
      ALTER TABLE departments ALTER COLUMN id SET DEFAULT nextval('departments_id_seq');
    `);
    console.log('✅ Departments id sequence fixed successfully!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error fixing sequence:', err);
    process.exit(1);
  }
}

fixSeq();
