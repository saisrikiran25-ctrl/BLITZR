import { DataSource } from 'typeorm';
import * as fs from 'fs';
import * as path from 'path';

export async function runNativeMigrations(dataSource: DataSource) {
    try {
        console.log('--- NATIVE MIGRATIONS STARTING ---');
        
        // 1. Create a simple migrations tracking table if it doesn't exist
        await dataSource.query(`
            CREATE TABLE IF NOT EXISTS _migrations_log (
                id SERIAL PRIMARY KEY,
                filename TEXT UNIQUE NOT NULL,
                applied_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        `);

        // 2. Get list of files - using absolute path relative to this file
        // In dist, this file will be in dist/apps/backend/src/config/
        // migrations folder will be in dist/apps/backend/migrations/
        const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
        
        console.log(`Looking for migrations in: ${migrationsDir}`);
        
        if (!fs.existsSync(migrationsDir)) {
            console.error(`Migrations directory missing at: ${migrationsDir}`);
            console.log('Current __dirname:', __dirname);
            return; // Skip if missing (might happen in dev if not built)
        }

        const files = fs.readdirSync(migrationsDir)
            .filter(f => f.endsWith('.sql'))
            .sort();

        console.log(`Found ${files.length} migration files.`);

        // 3. Run each migration in a transaction
        for (const file of files) {
            const rows = await dataSource.query('SELECT 1 FROM _migrations_log WHERE filename = $1', [file]);
            
            if (rows.length === 0) {
                console.log(`Applying: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                
                const queryRunner = dataSource.createQueryRunner();
                await queryRunner.connect();
                await queryRunner.startTransaction();
                
                try {
                    await queryRunner.query(sql);
                    await queryRunner.query('INSERT INTO _migrations_log (filename) VALUES ($1)', [file]);
                    await queryRunner.commitTransaction();
                    console.log(`✅ ${file} success.`);
                } catch (err) {
                    await queryRunner.rollbackTransaction();
                    console.error(`❌ FAILED: ${file}`, (err as Error).message);
                    throw err;
                } finally {
                    await queryRunner.release();
                }
            }
        }

        console.log('--- NATIVE MIGRATIONS COMPLETED ---');
    } catch (err) {
        console.error('FATAL SYSTEM ERROR during native migrations:', err);
        throw err; // Fail the bootstrap
    }
}
