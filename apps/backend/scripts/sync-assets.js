const fs = require('fs');
const path = require('path');

/**
 * Configuration
 * Paths are relative to the location of this script in apps/backend/scripts
 */
const MIGRATIONS_SRC = path.join(__dirname, '..', 'migrations');
const MIGRATIONS_DEST = path.join(__dirname, '..', 'dist', 'apps', 'backend', 'migrations');

const CLIENT_SRC = path.join(__dirname, '..', '..', 'mobile', 'dist');
const CLIENT_DEST = path.join(__dirname, '..', 'dist', 'client');

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
 * Recursively copies a directory.
 */
function copyDir(src, dest) {
    ensureDir(dest);
    const entries = fs.readdirSync(src, { withFileTypes: true });

    for (let entry of entries) {
        const srcPath = path.join(src, entry.name);
        const destPath = path.join(dest, entry.name);

        if (entry.isDirectory()) {
            copyDir(srcPath, destPath);
        } else {
            fs.copyFileSync(srcPath, destPath);
        }
    }
}

/**
 * Syncs migrations and client assets.
 */
function syncAssets() {
    console.log('--- SYNCING ASSETS ---');

    // 1. Sync Migrations
    console.log('Syncing Migrations...');
    if (fs.existsSync(MIGRATIONS_SRC)) {
        ensureDir(MIGRATIONS_DEST);
        const files = fs.readdirSync(MIGRATIONS_SRC).filter(f => f.endsWith('.sql'));
        files.forEach(file => {
            fs.copyFileSync(path.join(MIGRATIONS_SRC, file), path.join(MIGRATIONS_DEST, file));
        });
        console.log(`✅ Synced ${files.length} migrations to dist.`);
    } else {
        console.warn('⚠️ Warning: Migrations source not found.');
    }

    // 2. Sync Client (Frontend)
    console.log('Syncing Client Frontend...');
    if (fs.existsSync(CLIENT_SRC)) {
        if (fs.existsSync(CLIENT_DEST)) {
            fs.rmSync(CLIENT_DEST, { recursive: true, force: true });
        }
        copyDir(CLIENT_SRC, CLIENT_DEST);
        console.log('✅ Successfully synced mobile web build to dist/client.');
    } else {
        console.error('❌ Error: Mobile dist folder not found at:', CLIENT_SRC);
        console.log('Please ensure you have run "npx expo export" in apps/mobile first.');
        // We don't exit(1) here to allow backend-only builds if frontend isn't ready
    }
}

syncAssets();
