const { Client } = require('pg');
const bcrypt = require('bcrypt');

const client = new Client({
    user: 'blitzr_admin',
    host: 'localhost',
    database: 'blitzr_prime',
    password: 'blitzr_dev_secret',
    port: 5434,
});

async function run() {
    await client.connect();
    
    // 1. Find IIFT Kakinada
    const res = await client.query("SELECT institution_id, name FROM institutions WHERE email_domain = 'iift.edu' AND name ILIKE '%Kakinada%'");
    if (res.rows.length === 0) {
        console.error('IIFT Kakinada not found');
        process.exit(1);
    }
    const instId = res.rows[0].institution_id;
    const instName = res.rows[0].name;
    console.log(`Found ${instName} (${instId})`);

    const users = [
        { username: 'Saksham', email: 'saksham_ipm25@iift.edu', password: 'testsaksham' },
        { username: 'Aarav', email: 'aarav_ipm25@iift.edu', password: 'testaarav' },
        { username: 'SaiK', email: 'saisrikiran_ipm25@iift.edu', password: 'testsaikiran' }
    ];

    for (const u of users) {
        const salt = await bcrypt.genSalt(12);
        const hash = await bcrypt.hash(u.password, salt);
        
        try {
            await client.query(
                `INSERT INTO users (username, email, password_hash, institution_id, display_name, credibility_score, tos_accepted) 
                 VALUES ($1, $2, $3, $4, $5, 100, true) 
                 ON CONFLICT (email) DO UPDATE SET password_hash = $3, username = $1`,
                [u.username, u.email, hash, instId, u.username]
            );
            console.log(`User ${u.username} created/updated`);
        } catch (e) {
            console.error(`Failed to create ${u.username}:`, e.message);
        }
    }

    await client.end();
}

run();
