import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.join(process.cwd(), 'apps/backend/.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434', 10),
    username: process.env.DB_USERNAME || 'blitzr_admin',
    password: process.env.DB_PASSWORD || 'blitzr_dev_secret',
    database: process.env.DB_DATABASE || 'blitzr_prime',
});

async function runMigrations() {
    try {
        await dataSource.initialize();
        console.log('Connected to DB for migrations.');

        const migrationsDir = path.join(process.cwd(), 'apps/backend/migrations');
        const files = fs.readdirSync(migrationsDir).sort();

        for (const file of files) {
            if (file.endsWith('.sql')) {
                console.log(`Running migration: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                try {
                    await dataSource.query(sql);
                    console.log(`SUCCESS: ${file}`);
                } catch (sqlErr) {
                    console.error(`ERROR in ${file}:`, sqlErr);
                    throw sqlErr;
                }
            }
        }

        console.log('All migrations applied successfully!');
    } catch (err) {
        console.error('Migration failed:', err);
        process.exit(1);
    } finally {
        await dataSource.destroy();
    }
}

runMigrations();
