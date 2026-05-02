/**
 * reactivate-tickers.js
 * 
 * Reactivates $$SAKSHAMIPM25, $$ALIIPM25, and $$AASHRITHIPM25
 * by setting their status back to ACTIVE and clearing frozen_until.
 * 
 * Run with:
 *   DATABASE_URL="<your_db_url>" node scripts/reactivate-tickers.js
 * 
 * Or on DigitalOcean App Platform console:
 *   node scripts/reactivate-tickers.js
 *   (DATABASE_URL is already injected as an env var)
 */

const { Client } = require('pg');

const TICKERS_TO_REACTIVATE = [
    '$SAKSHAMIPM25',
    '$ALIIPM25',
    '$AASHRITHIPM25',
];

async function main() {
    const connectionString = process.env.DATABASE_URL;

    if (!connectionString) {
        // Fallback to local dev config
        console.warn('⚠️  No DATABASE_URL found, trying local dev config...');
    }

    const client = new Client(
        connectionString
            ? { connectionString, ssl: { rejectUnauthorized: false } }
            : {
                host: process.env.DB_HOST || 'localhost',
                port: parseInt(process.env.DB_PORT || '5434'),
                user: process.env.DB_USERNAME || 'blitzr_admin',
                password: process.env.DB_PASSWORD || 'blitzr_dev_secret',
                database: process.env.DB_DATABASE || 'blitzr_prime',
            }
    );

    await client.connect();
    console.log('✅ Connected to database\n');

    // Step 1: Check current status
    console.log('📊 Current status of target tickers:');
    const checkRes = await client.query(
        `SELECT ticker_id, status, frozen_until 
         FROM tickers 
         WHERE ticker_id = ANY($1::text[])`,
        [TICKERS_TO_REACTIVATE]
    );

    if (checkRes.rows.length === 0) {
        console.error('❌ None of the target tickers were found in the database!');
        console.log('   Showing all tickers for reference:');
        const allRes = await client.query(`SELECT ticker_id, status FROM tickers ORDER BY created_at DESC LIMIT 30`);
        console.table(allRes.rows);
        await client.end();
        return;
    }

    console.table(checkRes.rows);

    // Check if any are DELISTED (permanent — need special handling)
    const delisted = checkRes.rows.filter(r => r.status === 'DELISTED');
    if (delisted.length > 0) {
        console.warn(`⚠️  The following are DELISTED (holdings may have been refunded):`);
        delisted.forEach(r => console.warn(`   - ${r.ticker_id}`));
        console.warn('   Reactivating anyway as instructed...\n');
    }

    // Step 2: Reactivate
    const updateRes = await client.query(
        `UPDATE tickers 
         SET status = 'ACTIVE', 
             frozen_until = NULL,
             updated_at = NOW()
         WHERE ticker_id = ANY($1::text[])
         RETURNING ticker_id, status, frozen_until, updated_at`,
        [TICKERS_TO_REACTIVATE]
    );

    if (updateRes.rows.length === 0) {
        console.error('❌ UPDATE affected 0 rows. Check ticker IDs above.');
        await client.end();
        return;
    }

    console.log('\n✅ Reactivated successfully:');
    console.table(updateRes.rows);

    // Step 3: Sync users.is_ipo_active for the owners
    const syncRes = await client.query(
        `UPDATE users 
         SET is_ipo_active = true, updated_at = NOW()
         WHERE user_id IN (
             SELECT owner_id FROM tickers WHERE ticker_id = ANY($1::text[])
         )
         RETURNING user_id, email, is_ipo_active`,
        [TICKERS_TO_REACTIVATE]
    );

    console.log('\n✅ Owner is_ipo_active flag synced:');
    console.table(syncRes.rows);

    console.log('\n🎉 Done! All 3 tickers are ACTIVE again and will appear on the Floor.');
    await client.end();
}

main().catch(err => {
    console.error('❌ Script failed:', err.message);
    process.exit(1);
});
