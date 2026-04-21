const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Use DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is not set. Migration aborted.');
  process.exit(1);
}

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function runMigrations() {
  try {
    console.log('--- BLITZR DEPLOYMENT MIGRATIONS ---');
    console.log('Connecting to database...');
    await client.connect();
    console.log('Connected.');

    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations_log (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    const migrationsDir = path.join(__dirname, 'apps', 'backend', 'migrations');
    
    if (!fs.existsSync(migrationsDir)) {
       throw new Error(`Migrations directory missing at: ${migrationsDir}`);
    }

    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Checking ${files.length} migration files...`);

    for (const file of files) {
      const { rows } = await client.query('SELECT 1 FROM _migrations_log WHERE filename = $1', [file]);
      
      if (rows.length === 0) {
        console.log(`Applying: ${file}`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        await client.query('BEGIN');
        try {
          await client.query(sql);
          await client.query('INSERT INTO _migrations_log (filename) VALUES ($1)', [file]);
          await client.query('COMMIT');
          console.log(`✅ Success.`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`❌ FAILED: ${file}`, err.message);
          throw err;
        }
      }
    }

    console.log('--- MIGRATIONS COMPLETED ---');
  } catch (err) {
    console.error('FATAL DEPLOYMENT ERROR:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
