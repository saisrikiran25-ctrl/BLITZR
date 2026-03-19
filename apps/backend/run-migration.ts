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
        const sqlPath = path.join(__dirname, 'migrations', '007_master_doc_migrations.sql');
        const sql = fs.readFileSync(sqlPath, 'utf8');
        await dataSource.query(sql);
        console.log('Migration 007 applied successfully.');
    } catch (err) {
        console.error('Migration failed', err);
        process.exit(1);
    } finally {
        await dataSource.destroy();
    }
}
run();
