const { Client } = require('pg');

const client = new Client({
    user: 'blitzr_admin',
    host: 'localhost',
    database: 'blitzr_prime',
    password: 'blitzr_dev_secret',
    port: 5434,
});

async function listTables() {
    try {
        await client.connect();
        console.log('Connected to blitzr_prime');

        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public';
        `);
        console.log('--- TABLES ---');
        console.log(JSON.stringify(tablesResult.rows.map(r => r.table_name), null, 2));

    } catch (err) {
        console.error('Error listing tables:', err.message);
    } finally {
        await client.end();
    }
}

listTables();
