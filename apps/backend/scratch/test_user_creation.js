const { Client } = require('pg');
const crypto = require('crypto');

async function main() {
    const client = new Client({
        host: 'localhost',
        port: 5434,
        user: 'blitzr_admin',
        password: 'blitzr_dev_secret',
        database: 'blitzr_prime',
    });

    const testEmail = `test_user_${Date.now()}@example.com`;
    const testUsername = `testuser_${Date.now()}`;
    const userId = crypto.randomUUID();

    try {
        await client.connect();
        console.log('Connected to DB');

        console.log(`Attempting to create user with ID: ${userId}`);
        
        // This simulates what UsersService.create(data) does with the NUCLEAR FIX
        const result = await client.query(
            `INSERT INTO users (user_id, email, username, password_hash, institution_id, college_domain) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING user_id`,
            [userId, testEmail, testUsername, 'hashed_password', null, 'example.com']
        );

        console.log('User created successfully. Returned ID:', result.rows[0].user_id);
        
        if (result.rows[0].user_id === userId) {
            console.log('SUCCESS: Generated ID matches returned ID.');
        } else {
            console.error('FAILURE: Generated ID does NOT match returned ID.');
        }

        // Cleanup
        await client.query('DELETE FROM users WHERE user_id = $1', [userId]);
        console.log('Test user cleaned up.');

    } catch (err) {
        console.error('Error during user creation test:', err.stack);
    } finally {
        await client.end();
    }
}

main();
