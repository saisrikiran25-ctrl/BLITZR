"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.runNativeMigrations = runNativeMigrations;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
async function runNativeMigrations(dataSource) {
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
                }
                catch (err) {
                    await queryRunner.rollbackTransaction();
                    console.error(`❌ FAILED: ${file}`, err.message);
                    throw err;
                }
                finally {
                    await queryRunner.release();
                }
            }
        }
        console.log('--- NATIVE MIGRATIONS COMPLETED ---');
    }
    catch (err) {
        console.error('FATAL SYSTEM ERROR during native migrations:', err);
        throw err; // Fail the bootstrap
    }
}
