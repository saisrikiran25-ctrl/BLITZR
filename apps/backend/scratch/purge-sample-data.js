const { Client } = require('pg');

const client = new Client({
    user: 'blitzr_admin',
    host: 'localhost',
    database: 'blitzr_prime',
    password: 'blitzr_dev_secret',
    port: 5434,
});

async function aggressivePurge() {
    try {
        await client.connect();
        console.log('Connected to blitzr_prime');

        console.log('Truncating dependent tables...');
        // Added prop_events to the list to avoid FK violations
        await client.query('TRUNCATE TABLE transactions, holdings, notifications, rumor_votes, post_disputes, rumor_posts, tickers, ohlc_candles, currency_exchanges, prop_bets, prop_events CASCADE;');
        
        console.log('Deleting all users...');
        await client.query('DELETE FROM users;');

        console.log('Clearing waitlist...');
        await client.query('DELETE FROM waitlist;');

        console.log('AGGRESSIVE PURGE COMPLETE - Database is now clean of users and activity.');

    } catch (err) {
        console.error('Error during purge:', err.message);
    } finally {
        await client.end();
    }
}

aggressivePurge();
