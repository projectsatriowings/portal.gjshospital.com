import { pool } from './config/db.js';

async function initServicesTables() {
  try {
    console.log('⏳ Creating outsourced_services and facility_services tables...');

    // 1. OUTSOURCED SERVICES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS outsourced_services (
        id SERIAL PRIMARY KEY,
        icon VARCHAR(100) DEFAULT 'Droplet',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. FACILITY SERVICES TABLE
    await pool.query(`
      CREATE TABLE IF NOT EXISTS facility_services (
        id SERIAL PRIMARY KEY,
        icon VARCHAR(100) DEFAULT 'Pill',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // Check if outsourced_services has rows
    const outCheck = await pool.query('SELECT COUNT(*) FROM outsourced_services');
    if (parseInt(outCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding default outsourced_services...');
      await pool.query(`
        INSERT INTO outsourced_services (icon, title, description, display_order, status) VALUES
        ('Droplet', 'Blood Bank', 'Safe & reliable blood storage and transfusion services.', 1, 'active'),
        ('Activity', 'MRI / CT / Scanning', 'Advanced imaging services for accurate diagnosis.', 2, 'active'),
        ('Shirt', 'Laundry', 'Hygienic and professional laundry services.', 3, 'active');
      `);
    }

    // Check if facility_services has rows
    const facCheck = await pool.query('SELECT COUNT(*) FROM facility_services');
    if (parseInt(facCheck.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding default facility_services...');
      await pool.query(`
        INSERT INTO facility_services (icon, title, description, display_order, status) VALUES
        ('Pill', 'Pharmacy', 'Round-the-clock pharmacy with all essential medicines.', 1, 'active'),
        ('TestTube', 'Laboratory', 'Fully automated lab for accurate diagnostics and reports.', 2, 'active'),
        ('Truck', 'Ambulance', '24/7 emergency ambulance service for quick patient transfer.', 3, 'active'),
        ('Bed', 'ICU / Emergency', 'Critical care units equipped with modern life support systems.', 4, 'active'),
        ('Scissors', 'Operation Theatre', 'Advanced surgical suites with latest technology.', 5, 'active'),
        ('Radio', 'Radiology', 'Digital X-Ray, MRI, CT Scan and ultrasound facilities.', 6, 'active'),
        ('ShieldCheck', 'Sterilization', 'Strict infection control and sterilization protocols.', 7, 'active'),
        ('Accessibility', 'Physiotherapy', 'Post-surgery and injury rehabilitation services.', 8, 'active');
      `);
    }

    console.log('✅ Successfully created & seeded outsourced_services and facility_services tables!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Error initializing services tables:', err);
    process.exit(1);
  }
}

initServicesTables();
