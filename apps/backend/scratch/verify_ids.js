
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
        console.log('Connected to DB');

        const instResult = await client.query("SELECT institution_id, name, short_code FROM institutions WHERE short_code = 'IIFT-KK'");
        console.log('Institution ID for IIFT-KK:', instResult.rows);

        if (instResult.rows.length > 0) {
            const instId = instResult.rows[0].institution_id;
            
            const userCount = await client.query("SELECT count(*) FROM users WHERE institution_id = $1", [instId]);
            console.log('User count for IIFT-KK:', userCount.rows[0].count);

            const userEmails = await client.query("SELECT email FROM users WHERE institution_id = $1", [instId]);
            console.log('User emails for IIFT-KK:', userEmails.rows.map(r => r.email));

            const tickerCount = await client.query("SELECT count(*) FROM tickers WHERE owner_id IN (SELECT user_id FROM users WHERE institution_id = $1)", [instId]);
            console.log('Ticker count for IIFT-KK:', tickerCount.rows[0].count);

            const rumorCount = await client.query("SELECT count(*) FROM rumor_posts WHERE author_id IN (SELECT user_id FROM users WHERE institution_id = $1)", [instId]);
            console.log('Rumor count for IIFT-KK:', rumorCount.rows[0].count);
            
            const propEventCount = await client.query("SELECT count(*) FROM prop_events WHERE institution_id = $1", [instId]);
            console.log('Prop Event count for IIFT-KK:', propEventCount.rows[0].count);
        }

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

main();
