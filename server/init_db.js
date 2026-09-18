import pg from 'pg';
import dotenv from 'dotenv';
dotenv.config();

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}

const pool = new pg.Pool({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function upgradeDepartmentsSchema() {
  try {
    const client = await pool.connect();
    console.log("⚡ Upgrading departments schema with 12-tab CMS & Draft/Publish support...");

    await client.query(`
      CREATE TABLE IF NOT EXISTS departments (
        id SERIAL PRIMARY KEY,
        slug VARCHAR(100) UNIQUE NOT NULL,
        name VARCHAR(150) NOT NULL,
        tagline TEXT,
        short_description TEXT,
        full_description TEXT,
        icon VARCHAR(50) DEFAULT 'Activity',
        color_theme VARCHAR(50) DEFAULT 'blue',
        status VARCHAR(20) DEFAULT 'active',
        publish_status VARCHAR(20) DEFAULT 'published',
        vision TEXT,
        mission TEXT,
        services JSONB DEFAULT '[]'::jsonb,
        treatments JSONB DEFAULT '[]'::jsonb,
        facilities JSONB DEFAULT '[]'::jsonb,
        why_choose JSONB DEFAULT '[]'::jsonb,
        faqs JSONB DEFAULT '[]'::jsonb,
        testimonials JSONB DEFAULT '[]'::jsonb,
        stats JSONB DEFAULT '{}'::jsonb,
        hero JSONB DEFAULT '{}'::jsonb,
        overview JSONB DEFAULT '{}'::jsonb,
        cta JSONB DEFAULT '{}'::jsonb,
        seo JSONB DEFAULT '{}'::jsonb,
        draft_data JSONB DEFAULT '{}'::jsonb,
        banner_image TEXT,
        overview_image TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await client.query(`
      ALTER TABLE departments
      ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'active',
      ADD COLUMN IF NOT EXISTS publish_status VARCHAR(20) DEFAULT 'published',
      ADD COLUMN IF NOT EXISTS hero JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS overview JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS cta JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS seo JSONB DEFAULT '{}'::jsonb,
      ADD COLUMN IF NOT EXISTS draft_data JSONB DEFAULT '{}'::jsonb;
    `);

    console.log("🎉 Departments schema upgraded with 12-tab CMS and Draft/Publish columns!");
    client.release();
    process.exit(0);
  } catch (err) {
    console.error("Database Upgrade Error:", err);
    process.exit(1);
  }
}

upgradeDepartmentsSchema();
