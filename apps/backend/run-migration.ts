import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

config({ path: path.join(__dirname, '.env') });

const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME || 'blitzr_admin',
    password: process.env.DB_PASSWORD || 'blitzr_dev_secret',
    database: process.env.DB_DATABASE || 'blitzr_prime',
});

async function run() {
    try {
        await dataSource.initialize();
        const migrationsDir = path.join(__dirname, 'migrations');
        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        for (const file of files) {
            console.log(`Applying migration: ${file}`);
            const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
            await dataSource.query(sql);
        }
        console.log('All migrations applied successfully.');
    } catch (err) {
        console.error('Migration failed', err);
        process.exit(1);
    } finally {
        await dataSource.destroy();
    }
}
run();
