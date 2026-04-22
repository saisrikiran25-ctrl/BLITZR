const fs = require('fs');
const path = require('path');

// Configuration
const MIGRATIONS_SRC = path.join(__dirname, '..', 'migrations');
const MIGRATIONS_DEST = path.join(__dirname, '..', 'dist', 'apps', 'backend', 'migrations');

/**
 * Ensures a directory exists.
 */
function ensureDir(dir) {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
    }
}

/**
 * Copies all .sql files from src to dest.
 */
function syncMigrations() {
    console.log('--- SYNCING MIGRATIONS ---');
    console.log(`Source: ${MIGRATIONS_SRC}`);
    console.log(`Dest:   ${MIGRATIONS_DEST}`);

    if (!fs.existsSync(MIGRATIONS_SRC)) {
        console.error('❌ Error: migrations source folder not found!');
        process.exit(1);
    }

    ensureDir(MIGRATIONS_DEST);

    const files = fs.readdirSync(MIGRATIONS_SRC);
    const sqlFiles = files.filter(f => f.endsWith('.sql'));

    let count = 0;
    sqlFiles.forEach(file => {
        const srcPath = path.join(MIGRATIONS_SRC, file);
        const destPath = path.join(MIGRATIONS_DEST, file);
        fs.copyFileSync(srcPath, destPath);
        count++;
    });

    console.log(`✅ Successfully synced ${count} migration files to dist folder.`);
}

syncMigrations();
