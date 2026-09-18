import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}
const pool = new pg.Pool({ connectionString });

async function initPharmacySchema() {
  const client = await pool.connect();
  try {
    console.log('⚡ Initializing Pharmacy Stock Management & Dispensing Schema...');

    // 1. Create/extend medicines table
    await client.query(`
      CREATE TABLE IF NOT EXISTS medicines (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) DEFAULT 'GJS-HOSP-01',
        name VARCHAR(255) NOT NULL,
        unit_price NUMERIC(10, 2) NOT NULL,
        unit VARCHAR(50) DEFAULT 'tablet',
        current_stock INT DEFAULT 0,
        reorder_level INT DEFAULT 10,
        expiry_date DATE,
        status VARCHAR(20) DEFAULT 'ACTIVE',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);

    await client.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS current_stock INT DEFAULT 0;`);
    await client.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS reorder_level INT DEFAULT 10;`);
    await client.query(`ALTER TABLE medicines ADD COLUMN IF NOT EXISTS expiry_date DATE;`);
    console.log('✅ Created & verified medicines table with stock columns.');

    // 2. Create stock_movements table
    await client.query(`
      CREATE TABLE IF NOT EXISTS stock_movements (
        id SERIAL PRIMARY KEY,
        hospital_id VARCHAR(50) DEFAULT 'GJS-HOSP-01',
        medicine_id INT NOT NULL REFERENCES medicines(id) ON DELETE CASCADE,
        type VARCHAR(30) NOT NULL, -- PURCHASE_IN, DISPENSED_OUT, ADJUSTMENT
        quantity INT NOT NULL,
        reference TEXT,
        created_by INT,
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Created stock_movements ledger table.');

    // 3. Extend prescription_medicines table for stock & dispensing status
    await client.query(`ALTER TABLE prescription_medicines ADD COLUMN IF NOT EXISTS dispensed_status VARCHAR(30) DEFAULT 'PENDING';`);
    await client.query(`ALTER TABLE prescription_medicines ADD COLUMN IF NOT EXISTS dispensed_quantity INT;`);
    await client.query(`ALTER TABLE prescription_medicines ADD COLUMN IF NOT EXISTS dispensed_note TEXT;`);
    await client.query(`ALTER TABLE prescription_medicines ADD COLUMN IF NOT EXISTS medicine_id INT;`);
    console.log('✅ Extended prescription_medicines with dispensed_status and medicine_id.');

    // 4. Insert initial sample medicines if empty
    const countRes = await client.query(`SELECT COUNT(*) FROM medicines`);
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log('📦 Inserting initial sample medicines with stock...');
      await client.query(`
        INSERT INTO medicines (hospital_id, name, unit_price, unit, current_stock, reorder_level, status) VALUES
        ('GJS-HOSP-01', 'Dolo 650mg (Paracetamol)', 3.50, 'tablet', 100, 15, 'ACTIVE'),
        ('GJS-HOSP-01', 'Cetirizine 10mg', 4.00, 'tablet', 50, 10, 'ACTIVE'),
        ('GJS-HOSP-01', 'Pantoprazole 40mg', 12.00, 'tablet', 40, 10, 'ACTIVE'),
        ('GJS-HOSP-01', 'Asthalin Inhaler (100 mcg)', 160.00, 'bottle', 20, 5, 'ACTIVE'),
        ('GJS-HOSP-01', 'Montair LC (Montelukast + Levocetirizine)', 18.00, 'tablet', 0, 10, 'ACTIVE'),
        ('GJS-HOSP-01', 'Gelusil MPS Syrup 200ml', 140.00, 'bottle', 15, 5, 'ACTIVE'),
        ('GJS-HOSP-01', 'Amlodipine 5mg', 5.00, 'tablet', 60, 10, 'ACTIVE'),
        ('GJS-HOSP-01', 'Telmisartan 40mg', 8.50, 'tablet', 45, 10, 'ACTIVE'),
        ('GJS-HOSP-01', 'Metformin 500mg', 4.50, 'tablet', 80, 15, 'ACTIVE'),
        ('GJS-HOSP-01', 'Amoxicillin 500mg', 15.00, 'capsule', 30, 10, 'ACTIVE');
      `);
      console.log('✅ Inserted sample medicine catalog items with stock.');
    } else {
      // Ensure existing medicines have positive stock except Montair LC
      await client.query(`UPDATE medicines SET current_stock = 100 WHERE name LIKE '%Dolo%' AND current_stock = 0;`);
      await client.query(`UPDATE medicines SET current_stock = 40 WHERE name LIKE '%Pantoprazole%' AND current_stock = 0;`);
      await client.query(`UPDATE medicines SET current_stock = 25 WHERE name LIKE '%Gelusil%' AND current_stock = 0;`);
      await client.query(`UPDATE medicines SET current_stock = 60 WHERE name LIKE '%Amlodipine%' AND current_stock = 0;`);
    }

    // 5. Seed PHARMACIST user
    const userCheck = await client.query(`SELECT id FROM users WHERE LOWER(email) = 'pharmacist@gjshospital.com'`);
    if (userCheck.rows.length === 0) {
      console.log('👤 Seeding PHARMACIST user account...');
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash('PharmacistPass123!', 10);
      await client.query(`
        INSERT INTO users (hospital_id, name, email, password_hash, role, status)
        VALUES ('GJS-HOSP-01', 'Pharm. Suresh Kumar', 'pharmacist@gjshospital.com', $1, 'PHARMACIST', 'active');
      `, [hash]);
      console.log('✅ Created PHARMACIST user (email: pharmacist@gjshospital.com).');
    }

    // 6. Seed ACCOUNTANT user
    const acctCheck = await client.query(`SELECT id FROM users WHERE LOWER(email) = 'accountant@gjshospital.com'`);
    if (acctCheck.rows.length === 0) {
      console.log('👤 Seeding ACCOUNTANT user account...');
      const bcrypt = (await import('bcryptjs')).default;
      const hash = await bcrypt.hash('AccountantPass123!', 10);
      await client.query(`
        INSERT INTO users (hospital_id, name, email, password_hash, role, status)
        VALUES ('GJS-HOSP-01', 'Acct. Ramesh Sharma', 'accountant@gjshospital.com', $1, 'ACCOUNTANT', 'active');
      `, [hash]);
      console.log('✅ Created ACCOUNTANT user (email: accountant@gjshospital.com).');
    }

    console.log('\n🎉 Pharmacy Stock Management Schema Initialization Complete!');
  } catch (err) {
    console.error('❌ Error initializing pharmacy schema:', err);
  } finally {
    client.release();
    await pool.end();
  }
}

initPharmacySchema();
