const { Client } = require('pg');
require('dotenv').config({ path: 'apps/backend/.env' });

async function checkInstitutions() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
    await client.connect();
    try {
        const res = await client.query("SELECT institution_id, name, email_domain FROM institutions WHERE name ILIKE '%IIFT%'");
        console.log('Institutions found:', res.rows);
    } finally {
        await client.end();
    }
}

checkInstitutions();
