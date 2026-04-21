const { Client } = require('pg');

const client = new Client({
    user: 'blitzr_admin',
    host: 'localhost',
    database: 'blitzr_prime',
    password: 'blitzr_dev_secret',
    port: 5434,
});

async function checkSampleData() {
    try {
        await client.connect();
        console.log('Connected to blitzr_prime');

        const results = {};

        // 1. Check Users and Suspicious Domains
        console.log('Checking Users and Suspicious Domains...');
        const userScan = await client.query(`
            SELECT u.user_id, u.email, u.display_name, i.name as institution_name
            FROM users u
            LEFT JOIN institutions i ON u.institution_id = i.institution_id
            WHERE u.email ILIKE '%test%' 
               OR u.email ILIKE '%sample%' 
               OR u.email ILIKE '%example%'
               OR u.display_name ILIKE '%test%'
               OR u.display_name ILIKE '%sample%'
               OR u.display_name ILIKE '%dummy%'
               OR u.email LIKE '%@lift.edu'
               OR u.email LIKE '%@example.com'
               OR i.institution_id IS NULL;
        `);
        results.suspicious_users = userScan.rows;

        const sampleUserIds = userScan.rows.map(u => u.user_id);
        
        // 2. Check Rumors
        console.log('Checking Rumors...');
        let rumorsQueryResult;
        if (sampleUserIds.length > 0) {
            const sampleUserIdList = sampleUserIds.map(id => `'${id}'`).join(',');
            rumorsQueryResult = await client.query(`
                SELECT post_id, content, author_id
                FROM rumor_posts 
                WHERE author_id IN (${sampleUserIdList}) 
                   OR content ILIKE '%test %' 
                   OR content ILIKE '%test rumor%'
                   OR content ILIKE '%lorem ipsum%'
                   OR content ILIKE '%dummy%'
            `);
        } else {
            rumorsQueryResult = await client.query(`
                SELECT post_id, content 
                FROM rumor_posts 
                WHERE content ILIKE '%test %' 
                   OR content ILIKE '%test rumor%'
                   OR content ILIKE '%lorem ipsum%'
                   OR content ILIKE '%dummy%'
            `);
        }
        results.sample_rumors = rumorsQueryResult.rows;

        // 3. Check Tickers
        console.log('Checking Tickers owned by suspicious users...');
        if (sampleUserIds.length > 0) {
            const sampleUserIdList = sampleUserIds.map(id => `'${id}'`).join(',');
            const tickersQueryResult = await client.query(`
                SELECT ticker_id, owner_id FROM tickers WHERE owner_id IN (${sampleUserIdList});
            `);
            results.sample_tickers = tickersQueryResult.rows;
        } else {
            results.sample_tickers = [];
        }

        // 4. Check Transactions
        console.log('Checking Transactions involving suspicious users...');
        if (sampleUserIds.length > 0) {
            const sampleUserIdList = sampleUserIds.map(id => `'${id}'`).join(',');
            const tradesQueryResult = await client.query(`
                SELECT COUNT(*) FROM transactions WHERE user_id IN (${sampleUserIdList});
            `);
            results.sample_trade_count = parseInt(tradesQueryResult.rows[0].count);
        } else {
            results.sample_trade_count = 0;
        }

        // 5. Check Prop Events for dummy data
        console.log('Checking Prop Events...');
        const propEventsQueryResult = await client.query(`
            SELECT event_id, title FROM prop_events 
            WHERE title ILIKE '%test%' 
               OR title ILIKE '%sample%' 
               OR title ILIKE '%dummy%';
        `);
        results.sample_prop_events = propEventsQueryResult.rows;

        // 6. Check Waitlist
        console.log('Checking Waitlist...');
        const waitlistQueryResult = await client.query(`
            SELECT email FROM waitlist WHERE email ILIKE '%test%' OR email ILIKE '%sample%' OR email LIKE '%@example.com';
        `);
        results.sample_waitlist = waitlistQueryResult.rows;

        console.log('--- SCAN RESULTS ---');
        console.log(JSON.stringify(results, null, 2));

    } catch (err) {
        console.error('Error during scan:', err.message);
    } finally {
        await client.end();
    }
}

checkSampleData();
