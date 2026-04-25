const { Client } = require('pg');
require('dotenv').config({ path: 'apps/backend/.env' });

async function check() {
    const client = new Client({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
    });
    try {
        await client.connect();
        const res = await client.query(`
            SELECT 
                ticker_id, 
                college_domain as ticker_domain, 
                u.username,
                i.short_code as owner_campus
            FROM tickers t
            JOIN users u ON t.owner_id = u.user_id
            JOIN institutions i ON u.institution_id = i.institution_id
            LIMIT 20;
        `);
        console.table(res.rows);
        
        const instRes = await client.query('SELECT name, short_code, email_domain FROM institutions WHERE name LIKE \'%IIFT%\'');
        console.table(instRes.rows);
        
    } catch (e) {
        console.error(e);
    } finally {
        await client.end();
    }
}
check();
