import { Client } from 'pg';

async function checkNaN() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'blitzr_admin',
        password: 'blitzr_dev_secret',
        database: 'blitzr_prime',
    });

    try {
        await client.connect();

        console.log('--- USER BALANCES BEFORE FIX ---');
        const saiRes = await client.query("SELECT user_id, email, cred_balance, chip_balance FROM users WHERE email='sai@iift.edu'");
        console.log("SAI: ", saiRes.rows[0]);

        const adminRes = await client.query("SELECT user_id, email, cred_balance, chip_balance FROM users WHERE email='admin@blitzr.edu'");
        console.log("ADMIN: ", adminRes.rows[0]);

        console.log('\n--- ATTEMPTING TO FIX NaN BALANCES ---');
        await client.query("UPDATE users SET chip_balance = 2000 WHERE chip_balance = 'NaN'");
        await client.query("UPDATE users SET cred_balance = 1000 WHERE cred_balance = 'NaN'");
        console.log('All NaN values securely reset.');

    } catch (err) {
        console.error('Error:', err);
    } finally {
        await client.end();
    }
}

checkNaN();
