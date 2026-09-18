import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}
const pool = new pg.Pool({ connectionString });

async function runMigration() {
  const client = await pool.connect();
  try {
    console.log('⚡ Running Pharmacy Module Extension Database Migration...');

    // 1. Create categories table
    await client.query(`
      CREATE TABLE IF NOT EXISTS medicine_categories (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) DEFAULT 'GJS-HOSP-01',
        name VARCHAR(255) NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Checked/created medicine_categories table.');

    // 2. Add category_id column to medicines
    await client.query(`
      ALTER TABLE medicines 
      ADD COLUMN IF NOT EXISTS category_id INT REFERENCES medicine_categories(id) ON DELETE SET NULL;
    `);
    console.log('✅ Checked/created category_id column in medicines.');

    // 3. Add batch tracking columns to stock_movements
    await client.query(`
      ALTER TABLE stock_movements 
      ADD COLUMN IF NOT EXISTS batch_number VARCHAR(100),
      ADD COLUMN IF NOT EXISTS expiry_date DATE;
    `);
    console.log('✅ Checked/created batch_number and expiry_date columns in stock_movements.');

    // 4. Create settings table
    await client.query(`
      CREATE TABLE IF NOT EXISTS pharmacy_settings (
        id INT PRIMARY KEY,
        default_reorder_level INT DEFAULT 10,
        expiry_alert_threshold INT DEFAULT 30,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Checked/created pharmacy_settings table.');

    // 5. Seed default categories if none exist
    const catCheck = await client.query('SELECT COUNT(*) FROM medicine_categories');
    if (parseInt(catCheck.rows[0].count, 10) === 0) {
      await client.query(`
        INSERT INTO medicine_categories (name) VALUES
        ('Tablets'),
        ('Syrups'),
        ('Injections'),
        ('Ointments'),
        ('Capsules'),
        ('Inhalers')
      `);
      console.log('✅ Seeded default categories.');
    }

    // 6. Seed default settings row (id = 1)
    await client.query(`
      INSERT INTO pharmacy_settings (id, default_reorder_level, expiry_alert_threshold)
      VALUES (1, 10, 30)
      ON CONFLICT (id) DO NOTHING;
    `);
    console.log('✅ Seeded default pharmacy settings.');

    console.log('🎉 Migration successful!');
  } catch (err) {
    console.error('❌ Migration failed:', err);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration();
