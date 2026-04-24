const { Client } = require('pg');

async function updateEvents() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'blitzr_admin',
        password: 'blitzr_dev_secret',
        database: 'blitzr_prime'
    });

    try {
        await client.connect();
        console.log('Connected to DB');

        // Check Lockdown
        const res = await client.query(`SELECT * FROM settings WHERE key = 'GLOBAL_LOCKDOWN'`);
        console.log('Lockdown Settings:', res.rows);

    } catch (err) {
        console.error('Error executing query', err.stack);
    } finally {
        await client.end();
    }
}

updateEvents();
