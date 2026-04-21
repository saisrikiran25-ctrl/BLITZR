const { Client } = require('pg');

const client = new Client({
    user: 'blitzr_admin',
    host: 'localhost',
    database: 'blitzr_prime',
    password: 'blitzr_dev_secret',
    port: 5434,
});

async function checkSchema() {
    try {
        await client.connect();
        console.log('Connected to blitzr_prime');

        console.log('Checking tickers table schema...');
        const schemaResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'tickers';
        `);
        console.log('--- TICKERS SCHEMA ---');
        console.log(JSON.stringify(schemaResult.rows, null, 2));

        console.log('Checking rumor_posts table schema...');
        const rumorsSchemaResult = await client.query(`
            SELECT column_name, data_type 
            FROM information_schema.columns 
            WHERE table_name = 'rumor_posts';
        `);
        console.log('--- RUMOR_POSTS SCHEMA ---');
        console.log(JSON.stringify(rumorsSchemaResult.rows, null, 2));

    } catch (err) {
        console.error('Error during schema check:', err.message);
    } finally {
        await client.end();
    }
}

checkSchema();
