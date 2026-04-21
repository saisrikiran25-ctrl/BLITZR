
const { Client } = require('pg');

async function main() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'blitzr_admin',
        password: 'blitzr_dev_secret',
        database: 'blitzr_prime',
    });

    try {
        await client.connect();
        console.log('--- STARTING TOTAL IIFT CLEANUP ---');

        // Helper to check if a column exists
        async function columnExists(table, column) {
            const res = await client.query(`
                SELECT 1 FROM information_schema.columns 
                WHERE table_name = $1 AND column_name = $2
            `, [table, column]);
            return res.rowCount > 0;
        }

        // 1. Ensure structural institutions exist
        console.log('Step 1: Ensuring structural institutions exist...');
        await client.query(`
            INSERT INTO institutions (name, short_code, email_domain, city, verified)
            VALUES 
            ('IIFT Delhi', 'IIFT-D', 'iift.edu', 'Delhi', TRUE),
            ('IIFT Kolkata', 'IIFT-K', 'iift.edu', 'Kolkata', TRUE),
            ('IIFT Kakinada', 'IIFT-KK', 'iift.edu', 'Kakinada', TRUE)
            ON CONFLICT (email_domain, name) DO NOTHING
        `);

        // Get the IDs
        const instRes = await client.query("SELECT institution_id FROM institutions WHERE email_domain = 'iift.edu'");
        const iiftInstIds = instRes.rows.map(r => r.institution_id);
        console.log('IIFT Institution IDs identified:', iiftInstIds);

        // 2. Identify sample users
        const userRes = await client.query("SELECT user_id, email FROM users WHERE email LIKE '%iift.edu' OR email LIKE '%iiift.edu'");
        const iiftUserIds = userRes.rows.map(r => r.user_id);
        console.log(`Identified ${iiftUserIds.length} sample users to purge.`);

        if (iiftUserIds.length === 0 && iiftInstIds.length === 0) {
            console.log('No matching sample data found.');
            return;
        }

        // Identify tickers owned by these users
        const tickerRes = await client.query("SELECT ticker_id FROM tickers WHERE owner_id = ANY($1)", [iiftUserIds]);
        const iiftTickerIds = tickerRes.rows.map(r => r.ticker_id);
        
        // 3. Delete dependent data in order
        console.log('Step 3: Purging dependent sample data...');

        // Check tables
        const tables = {};
        const checkTables = ['rumor_posts', 'rumors', 'moderation_queue', 'post_disputes', 'rumor_votes', 'prop_bets', 'transactions', 'holdings', 'tickers', 'ohlc_candles', 'currency_exchanges', 'notifications', 'admin_analytics', 'national_leaderboard', 'prop_events'];
        for (const t of checkTables) {
            tables[t] = (await client.query("SELECT 1 FROM information_schema.tables WHERE table_name = $1", [t])).rowCount > 0;
        }

        // --- PURGE DEPENDENCIES FIRST ---
        
        // 1. BETS for events created by IIFT users OR bets by IIFT users
        if (tables.prop_bets) {
            if (tables.prop_events) {
               await client.query("DELETE FROM prop_bets WHERE user_id = ANY($1) OR event_id IN (SELECT event_id FROM prop_events WHERE creator_id = ANY($1) OR institution_id = ANY($2))", [iiftUserIds, iiftInstIds]);
            } else {
               await client.query("DELETE FROM prop_bets WHERE user_id = ANY($1)", [iiftUserIds]);
            }
            console.log(`- Cleared prop_bets`);
        }

        // 2. TRANSACTIONS referencing IIFT tickers OR by IIFT users OR referencing IIFT events
        if (tables.transactions) {
            // By Ticker
            if (iiftTickerIds.length > 0) {
                await client.query("DELETE FROM transactions WHERE ticker_id = ANY($1)", [iiftTickerIds]);
            }
            // By Event
            if (tables.prop_events) {
                await client.query("DELETE FROM transactions WHERE prop_event_id IN (SELECT event_id FROM prop_events WHERE creator_id = ANY($1) OR institution_id = ANY($2))", [iiftUserIds, iiftInstIds]);
            }
            // By User
            await client.query("DELETE FROM transactions WHERE user_id = ANY($1)", [iiftUserIds]);
            console.log(`- Cleared transactions`);
        }

        // 3. PROP EVENTS created by IIFT users OR scoped to IIFT institutions
        if (tables.prop_events) {
            await client.query("DELETE FROM prop_events WHERE creator_id = ANY($1) OR institution_id = ANY($2)", [iiftUserIds, iiftInstIds]);
            console.log(`- Cleared prop_events`);
        }

        // 4. TICKER dependents (Holdings, Candles, then Tickers)
        if (iiftTickerIds.length > 0) {
            if (tables.holdings) await client.query("DELETE FROM holdings WHERE ticker_id = ANY($1)", [iiftTickerIds]);
            if (tables.ohlc_candles) await client.query("DELETE FROM ohlc_candles WHERE ticker_id = ANY($1)", [iiftTickerIds]);
            if (tables.national_leaderboard) await client.query("DELETE FROM national_leaderboard WHERE ticker_id = ANY($1)", [iiftTickerIds]);
            if (tables.moderation_queue) await client.query("DELETE FROM moderation_queue WHERE ticker_id = ANY($1)", [iiftTickerIds]);
            console.log(`- Cleared ticker dependencies`);
        }

        if (tables.tickers) {
            await client.query("DELETE FROM tickers WHERE owner_id = ANY($1)", [iiftUserIds]);
            console.log(`- Deleted tickers owned by sample users`);
        }

        // 5. RUMOR dependents
        if (tables.rumor_posts) {
            const pid = await columnExists('rumor_posts', 'post_id') ? 'post_id' : 'rumor_id';
            const domainFilter = "college_domain = ANY(ARRAY['IIFT-KK', 'IIFT-K', 'IIFT-D'])";
            
            if (tables.moderation_queue) await client.query(`DELETE FROM moderation_queue WHERE ${pid} IN (SELECT ${pid} FROM rumor_posts WHERE author_id = ANY($1) OR ${domainFilter})`, [iiftUserIds]);
            if (tables.post_disputes) await client.query(`DELETE FROM post_disputes WHERE ${pid} IN (SELECT ${pid} FROM rumor_posts WHERE author_id = ANY($1) OR ${domainFilter})`, [iiftUserIds]);
            if (tables.rumor_votes) {
                const vid = await columnExists('rumor_votes', 'post_id') ? 'post_id' : 'rumor_id';
                await client.query(`DELETE FROM rumor_votes WHERE ${vid} IN (SELECT ${pid} FROM rumor_posts WHERE author_id = ANY($1) OR ${domainFilter})`, [iiftUserIds]);
            }
            await client.query(`DELETE FROM rumor_posts WHERE author_id = ANY($1) OR ${domainFilter}`, [iiftUserIds]);
            console.log(`- Cleared rumor_posts and dependencies`);
        }

        // 6. Remaining user-linked data
        const userLinked = ['holdings', 'currency_exchanges', 'notifications', 'post_disputes', 'rumor_votes'];
        for (const t of userLinked) {
            if (tables[t] || (await client.query("SELECT 1 FROM information_schema.tables WHERE table_name = $1", [t])).rowCount > 0) {
                await client.query(`DELETE FROM ${t} WHERE user_id = ANY($1)`, [iiftUserIds]);
            }
        }
        console.log(`- Cleared remaining user-linked data`);

        // 7. Institution-linked data
        const instLinked = ['admin_analytics', 'national_leaderboard'];
        for (const t of instLinked) {
            if (tables[t]) {
                await client.query(`DELETE FROM ${t} WHERE institution_id = ANY($1)`, [iiftInstIds]);
            }
        }
        console.log(`- Cleared institution-linked data`);

        // 8. FINALLY USERS
        if (iiftUserIds.length > 0) {
            const count = await client.query("DELETE FROM users WHERE user_id = ANY($1)", [iiftUserIds]);
            console.log(`- Deleted ${count.rowCount} sample users.`);
        }

        console.log('--- CLEANUP COMPLETE ---');

    } catch (err) {
        console.error('Error during cleanup:', err.stack);
    } finally {
        await client.end();
    }
}

main();
