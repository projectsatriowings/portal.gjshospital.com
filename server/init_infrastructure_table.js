import { pool } from './config/db.js';

const initInfrastructureTable = async () => {
  try {
    console.log('⏳ Creating infrastructure_services table...');

    await pool.query(`
      CREATE TABLE IF NOT EXISTS infrastructure_services (
        id SERIAL PRIMARY KEY,
        icon VARCHAR(100) DEFAULT 'Building',
        title VARCHAR(255) NOT NULL,
        description TEXT,
        display_order INT DEFAULT 0,
        status VARCHAR(50) DEFAULT 'active',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const countRes = await pool.query('SELECT COUNT(*) FROM infrastructure_services');
    if (parseInt(countRes.rows[0].count, 10) === 0) {
      console.log('🌱 Seeding initial infrastructure services data...');

      const defaultItems = [
        ['🏨', 'Nurses Hostel', 'Safe and hygienic accommodation for nursing staff.', 1],
        ['🍽️', 'Canteen', 'Nutritious meals for patients, staff, and visitors.', 2],
        ['🧹', 'Housekeeping', '24/7 cleanliness and sanitization across all areas.', 3],
        ['🔧', 'Maintenance', 'Regular upkeep of hospital equipment and infrastructure.', 4],
        ['🛡️', 'Security', 'Trained security staff with full CCTV coverage.', 5],
        ['♻️', 'Waste Management', 'Efficient disposal of biomedical and general waste.', 6],
        ['🚗', 'Parking', 'Dedicated parking areas for patients and staff.', 7],
        ['☎️', 'Help Desk', 'Assistance for patient registration and information.', 8]
      ];

      for (const [icon, title, desc, order] of defaultItems) {
        await pool.query(
          `INSERT INTO infrastructure_services (icon, title, description, display_order, status)
           VALUES ($1, $2, $3, $4, 'active')`,
          [icon, title, desc, order]
        );
      }

      console.log('✅ Seeded 8 infrastructure services into Neon DB!');
    }

    console.log('🎉 infrastructure_services table ready!');
  } catch (err) {
    console.error('❌ Error initializing infrastructure_services table:', err);
  }
};

initInfrastructureTable();
