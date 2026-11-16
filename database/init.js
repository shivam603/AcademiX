// ============================================================
// database/init.js - Cross-platform Node.js DB initialization
// Runs all SQL scripts in order using node-postgres (pg)
// ============================================================
const fs = require('fs');
const path = require('path');
const { Client } = require('pg');
require('dotenv').config({ path: path.join(__dirname, '../server/.env') });

async function initDb() {
  const databaseUrl = process.env.DATABASE_URL;
  const config = databaseUrl
    ? {
        connectionString: databaseUrl,
        ssl: databaseUrl.includes('localhost') ? false : { rejectUnauthorized: false },
      }
    : {
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT) || 5432,
        user: process.env.DB_USER || 'postgres',
        password: process.env.DB_PASSWORD || 'postgres',
        database: process.env.DB_NAME || 'course_registration',
      };

  console.log('Connecting to database...');
  // If not using full DATABASE_URL, check if target database exists on local postgres
  if (!databaseUrl) {
    const adminClient = new Client({
      host: config.host,
      port: config.port,
      user: config.user,
      password: config.password,
      database: 'postgres',
    });

    try {
      await adminClient.connect();
      const res = await adminClient.query(
        'SELECT 1 FROM pg_database WHERE datname = $1',
        [config.database]
      );
      if (res.rowCount === 0) {
        console.log(`Database "${config.database}" does not exist. Creating...`);
        await adminClient.query(`CREATE DATABASE "${config.database}"`);
        console.log(`Database "${config.database}" created.`);
      }
    } catch (err) {
      console.warn('Admin database check info:', err.message);
    } finally {
      await adminClient.end().catch(() => {});
    }
  }

  const client = new Client(config);
  await client.connect();
  console.log(`Connected to database "${config.database || 'Render DB'}".`);

  const files = [
    'schema.sql',
    'functions.sql',
    'procedures.sql',
    'triggers.sql',
    'views.sql',
    'indexes.sql',
    'seed.sql',
  ];

  for (let i = 0; i < files.length; i++) {
    const file = files[i];
    console.log(`[${i + 1}/${files.length}] Running ${file}...`);
    const sql = fs.readFileSync(path.join(__dirname, file), 'utf8');
    await client.query(sql);
  }

  console.log('Refreshing materialized view...');
  try {
    await client.query('REFRESH MATERIALIZED VIEW mv_admin_dashboard_analytics;');
  } catch (mvErr) {
    console.warn('Materialized view refresh note:', mvErr.message);
  }

  console.log('========================================================');
  console.log('✅ Database initialization and seeding complete!');
  console.log('Demo Accounts:');
  console.log('  Student: s001@student.edu           (Pass: Demo@1234)');
  console.log('  Faculty: alice.morgan@university.edu (Pass: Demo@1234)');
  console.log('  Admin:   admin@university.edu        (Pass: Demo@1234)');
  console.log('========================================================');
  await client.end();
}

initDb().catch((err) => {
  console.error('❌ Database initialization failed:', err);
  process.exit(1);
});
