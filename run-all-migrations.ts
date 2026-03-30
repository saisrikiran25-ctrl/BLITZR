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
                console.log(`Running migration file: ${file}`);
                const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
                
                // Manual parser to handle $$ quoting
                const statements: string[] = [];
                let currentStatement = '';
                let inDollarQuote = false;
                
                for (let i = 0; i < sql.length; i++) {
                    const char = sql[i];
                    const nextTwo = sql.substring(i, i + 2);
                    
                    if (nextTwo === '$$') {
                        inDollarQuote = !inDollarQuote;
                        currentStatement += '$$';
                        i++; // Skip next $
                    } else if (char === ';' && !inDollarQuote) {
                        statements.push(currentStatement.trim());
                        currentStatement = '';
                    } else {
                        currentStatement += char;
                    }
                }
                if (currentStatement.trim().length > 0) {
                    statements.push(currentStatement.trim());
                }
                
                const filteredStatements = statements.filter(s => s.length > 0);
                console.log(`Found ${filteredStatements.length} statements in ${file}`);
                for (let i = 0; i < filteredStatements.length; i++) {
                    const statement = filteredStatements[i];
                    try {
                        await dataSource.query(statement);
                    } catch (sqlErr: any) {
                        // 42710: duplicate_object (e.g. TYPE already exists)
                        // 42P07: duplicate_table (e.g. TABLE already exists)
                        // 23505: unique_violation (e.g. seed already exists)
                        // 42703: undefined_column (e.g. already renamed)
                        if (sqlErr.code === '42710' || sqlErr.code === '42P07' || sqlErr.code === '23505' || sqlErr.code === '42703') {
                            // Already exists or already changed, skip
                        } else {
                            console.error(`FATAL ERROR in ${file} at statement ${i+1}:`);
                            console.error(statement);
                            console.error(sqlErr);
                            throw sqlErr;
                        }
                    }
                }
                console.log(`Successfully processed all statements in ${file}`);
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
