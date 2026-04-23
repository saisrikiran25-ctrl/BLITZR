const { Client } = require('pg');
require('dotenv').config({ path: 'apps/backend/.env' });

async function checkUsers() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
    await client.connect();
    try {
        const res = await client.query("SELECT user_id, username, email, institution_id FROM users WHERE institution_id = 'd1ea203d-ae80-4b86-9fb2-5a6e3b2e9bb8'");
        console.log('IIFT Kakinada Users:', res.rows);
    } finally {
        await client.end();
    }
}

checkUsers();
