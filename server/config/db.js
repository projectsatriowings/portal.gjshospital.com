import pg from 'pg';
import dotenv from 'dotenv';
import dns from 'node:dns';

// Prioritize IPv4 DNS lookups to prevent IPv6 ETIMEDOUT on networks with incomplete IPv6 routing
if (dns.setDefaultResultOrder) {
  dns.setDefaultResultOrder('ipv4first');
}

dotenv.config();

const { Pool } = pg;

// Neon Cloud PostgreSQL Connection Pool configuration
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required but was not found. Check your .env file.');
}

export const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false, // Required for Neon PostgreSQL connection
  },
  // Keep-alive and timeout configuration for Neon serverless / pooler stability
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 10000,
  max: 20,
});

pool.on('error', (err) => {
  // Catch idle client drops so they do not crash the Node process
  console.warn('⚠️ PostgreSQL pool notice (idle client disconnected):', err.message);
});

