const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

// Use DATABASE_URL from environment
const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('ERROR: DATABASE_URL environment variable is not set.');
  process.exit(1);
}

// 0. Manual Override Switch (Surgical)
const REAPPLY_LIST = (process.env.REAPPLY_MIGRATIONS || '').split(',').map(s => s.trim());

const client = new Client({
  connectionString: connectionString,
  ssl: {
    rejectUnauthorized: false // Required for DigitalOcean managed databases
  }
});

async function runMigrations() {
  try {
    console.log('Connecting to database for migrations...');
    await client.connect();
    console.log('Connected successfully.');

    // 1. Create a simple migrations tracking table if it doesn't exist
    await client.query(`
      CREATE TABLE IF NOT EXISTS _migrations_log (
        id SERIAL PRIMARY KEY,
        filename TEXT UNIQUE NOT NULL,
        applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    // 2. Get list of files
    const migrationsDir = path.join(__dirname, 'migrations');
    const files = fs.readdirSync(migrationsDir)
      .filter(f => f.endsWith('.sql'))
      .sort();

    console.log(`Found ${files.length} migration files.`);

    // 3. Run each migration in a transaction
    for (const file of files) {
      const { rows } = await client.query('SELECT 1 FROM _migrations_log WHERE filename = $1', [file]);
      
      const shouldReapply = REAPPLY_LIST.includes(file) || REAPPLY_LIST.includes(file.replace('.sql', ''));
      
      if (rows.length === 0 || shouldReapply) {
        if (shouldReapply) console.log(`[REPAIR] Re-applying migration: ${file}...`);
        else console.log(`Applying migration: ${file}...`);
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        
        await client.query('BEGIN');
        try {
          // Execute the SQL file content
          await client.query(sql);
          // Log the success (idempotent logging)
          await client.query('INSERT INTO _migrations_log (filename) VALUES ($1) ON CONFLICT (filename) DO NOTHING', [file]);
          await client.query('COMMIT');
          console.log(`✅ ${file} applied successfully.`);
        } catch (err) {
          await client.query('ROLLBACK');
          console.error(`❌ Error applying ${file}:`, err.message);
          throw err;
        }
      } else {
        console.log(`⏭️  Skipping already applied migration: ${file}`);
      }
    }

    console.log('All migrations completed successfully.');
  } catch (err) {
    console.error('FATAL LOG: Migration process failed:', err);
    process.exit(1);
  } finally {
    await client.end();
  }
}

runMigrations();
