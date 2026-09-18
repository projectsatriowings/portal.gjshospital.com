import { pool } from './config/db.js';

async function migrate() {
  const client = await pool.connect();
  try {
    console.log('Adding is_confirmed column to bill_items...');
    await client.query(`
      ALTER TABLE bill_items 
      ADD COLUMN IF NOT EXISTS is_confirmed BOOLEAN DEFAULT TRUE;
    `);
    console.log('✅ Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

migrate();
