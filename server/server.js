// ============================================================
// server.js - HTTP Server startup
// ============================================================
const app = require('./src/app');
const { pool } = require('./src/config/db');
const path = require('path');

const PORT = process.env.PORT || 5000;

async function checkAndAutoSeed() {
  if (!process.env.DATABASE_URL && process.env.NODE_ENV === 'production') {
    console.warn('⚠️ [CRITICAL] DATABASE_URL environment variable is NOT set in Render!');
    console.warn('⚠️ Please add DATABASE_URL under Render Web Service -> Environment.');
    return;
  }

  try {
    const res = await pool.query("SELECT to_regclass('public.users') AS tbl_exists");
    if (!res.rows[0].tbl_exists) {
      console.log('🔄 First run detected: initializing database schema and seed data...');
      const { initDb } = require(path.join(__dirname, '../database/init'));
      await initDb();
      console.log('✅ Database auto-initialized successfully!');
    } else {
      console.log('✅ Database connected and verified (users table exists)');
    }
  } catch (err) {
    console.error('Database connection/verification check:', err.message);
  }
}

const server = app.listen(PORT, async () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV || 'development'}`);
  await checkAndAutoSeed();
});

server.on('error', (err) => {
  console.error('Server error:', err);
  process.exit(1);
});

process.on('SIGTERM', () => {
  server.close(() => {
    console.log('Server shutting down gracefully');
    process.exit(0);
  });
});
