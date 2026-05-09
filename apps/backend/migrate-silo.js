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
            `UPDATE users SET institution_id = $1, college_domain = $2, updated_at = NOW() WHERE institution_id = $3 RETURNING user_id`,
            [TARGET_ID, TARGET_DOMAIN, SOURCE_ID]
        );
        console.log(`   -> Moved ${userRes.rowCount} users.\n`);

        // 2. Move Tickers
        console.log('2. Migrating Tickers...');
        const tickerRes = await client.query(
            `UPDATE tickers SET college_domain = $1, updated_at = NOW() WHERE college_domain = $2 RETURNING ticker_id`,
            [TARGET_DOMAIN, SOURCE_DOMAIN]
        );
        console.log(`   -> Moved ${tickerRes.rowCount} tickers.\n`);

        // 3. Move Rumors
        console.log('3. Migrating Rumors (Feed)...');
        const rumorRes = await client.query(
            `UPDATE rumor_posts SET college_domain = $1, updated_at = NOW() WHERE college_domain = $2 RETURNING post_id`,
            [TARGET_DOMAIN, SOURCE_DOMAIN]
        );
        console.log(`   -> Moved ${rumorRes.rowCount} rumors.\n`);

        // 4. Move Prop Events
        console.log('4. Migrating Prediction Markets...');
        const propRes = await client.query(
            `UPDATE prop_events SET institution_id = $1, college_domain = $2, updated_at = NOW() WHERE institution_id = $3 RETURNING event_id`,
            [TARGET_ID, TARGET_DOMAIN, SOURCE_ID]
        );
        console.log(`   -> Moved ${propRes.rowCount} events.\n`);

        await client.query('COMMIT'); // Apply changes
        
        console.log('✅✅✅ MIGRATION COMPLETE ✅✅✅');
        console.log('All users, stocks, feeds, and markets have been merged into IIFT Kakinada.');
        
    } catch (err) {
        await client.query('ROLLBACK'); // Cancel if anything breaks
        console.error('❌ MIGRATION FAILED - Changes rolled back.', err);
    } finally {
        await client.end();
    }
}

runMigration();
