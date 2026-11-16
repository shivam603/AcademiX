// ============================================================
// src/config/db.js - PostgreSQL Connection Pool
// ============================================================
const { Pool } = require('pg');

function getSSLConfig(url) {
  if (!url) return false;
  if (url.includes('localhost') || url.includes('127.0.0.1')) return false;
  // Render internal databases (dpg-* or .internal) do not support SSL
  if (url.includes('.internal') || (url.includes('dpg-') && !url.includes('.render.com'))) {
    return false;
  }
  return { rejectUnauthorized: false };
}

const poolConfig = process.env.DATABASE_URL
  ? {
      connectionString: process.env.DATABASE_URL,
      ssl: getSSLConfig(process.env.DATABASE_URL),
      max: parseInt(process.env.DB_POOL_MAX) || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 10000,
    }
  : {
      host:     process.env.DB_HOST     || 'localhost',
      port:     parseInt(process.env.DB_PORT) || 5432,
      database: process.env.DB_NAME     || 'academix',
      user:     process.env.DB_USER     || 'postgres',
      password: process.env.DB_PASSWORD || 'postgres',
      max:      parseInt(process.env.DB_POOL_MAX)  || 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    };

const pool = new Pool(poolConfig);

// Test connection on startup
pool.connect((err, client, release) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    release();
  }
});

pool.on('error', (err) => {
  console.error('Unexpected database pool error:', err);
});

/**
 * Execute a query using the pool (auto-releases client)
 */
const query = (text, params) => pool.query(text, params);

/**
 * Get a dedicated client for transactions.
 * IMPORTANT: Always call client.release() in a finally block.
 */
const getClient = () => pool.connect();

module.exports = { pool, query, getClient };
