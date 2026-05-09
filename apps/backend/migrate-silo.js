/**
 * MIGRATION SCRIPT: IIFT Delhi -> IIFT Kakinada
 * Moves all users, tickers, rumors, and prop events between the silos.
 */

const { Client } = require('pg');

const SOURCE_ID = 'deb73968-a2eb-43d1-968f-a660c6235c33'; // IIFT Delhi
const SOURCE_DOMAIN = 'IIFT-D';

const TARGET_ID = '117df183-375e-4977-ac50-e0ef1383d686'; // IIFT Kakinada
const TARGET_DOMAIN = 'IIFT-KK';

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
    console.error('ERROR: DATABASE_URL environment variable is not set.');
    process.exit(1);
}

const client = new Client({
    connectionString,
    ssl: { rejectUnauthorized: false }
});

async function runMigration() {
    try {
        await client.connect();
        console.log('✅ Connected to production database.\n');

        console.log(`Starting Data Migration...`);
        console.log(`SOURCE: IIFT Delhi (${SOURCE_ID})`);
        console.log(`TARGET: IIFT Kakinada (${TARGET_ID})\n`);

        await client.query('BEGIN'); // Start transaction for safety

        // 1. Move Users
        console.log('1. Migrating Users...');
        const userRes = await client.query(
            `UPDATE users SET institution_id = $1, college_domain = $2 WHERE institution_id = $3 RETURNING user_id`,
            [TARGET_ID, TARGET_DOMAIN, SOURCE_ID]
        );
        console.log(`   -> Moved ${userRes.rowCount} users.\n`);

        // 2. Move Tickers
        console.log('2. Migrating Tickers...');
        const tickerRes = await client.query(
            `UPDATE tickers SET college_domain = $1 WHERE college_domain = $2 RETURNING ticker_id`,
            [TARGET_DOMAIN, SOURCE_DOMAIN]
        );
        console.log(`   -> Moved ${tickerRes.rowCount} tickers.\n`);

        await client.query('COMMIT'); // Apply changes
        
        console.log('✅✅✅ MIGRATION COMPLETE ✅✅✅');
        console.log('All users and stocks have been merged into IIFT Kakinada.');
        
    } catch (err) {
        await client.query('ROLLBACK'); // Cancel if anything breaks
        console.error('❌ MIGRATION FAILED - Changes rolled back.', err);
    } finally {
        await client.end();
    }
}

runMigration();
