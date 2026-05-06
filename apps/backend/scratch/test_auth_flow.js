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

    try {
        await client.connect();
        console.log('Connected to DB');

        const testDomain = 'iift.edu';
        const institutionId = '2d1836ae-5a58-41a6-a1a5-1304ffc6e0a9'; // IIFT Delhi
        const baseUsername = 'tester';
        
        console.log('--- TEST 1: Basic User Creation with Manual UUID ---');
        const userId1 = crypto.randomUUID();
        const email1 = `tester_${Date.now()}@${testDomain}`;
        const username1 = `${baseUsername}_${Date.now()}`;
        
        const res1 = await client.query(
            `INSERT INTO users (user_id, email, username, password_hash, institution_id, college_domain) 
             VALUES ($1, $2, $3, $4, $5, $6) 
             RETURNING user_id, username`,
            [userId1, email1, username1, 'hash', institutionId, testDomain]
        );
        console.log(`Created user 1: ${res1.rows[0].username} (ID: ${res1.rows[0].user_id})`);
        if (res1.rows[0].user_id === userId1) console.log('SUCCESS: ID matches.');

        console.log('\n--- TEST 2: Username Collision Handling Simulation ---');
        // We will simulate the while loop in AuthService.ts
        const checkUsername = async (u) => {
            const res = await client.query('SELECT 1 FROM users WHERE username = $1 AND institution_id = $2', [u, institutionId]);
            return res.rows.length > 0;
        };

        const generateUsername = async (base) => {
            let u = base;
            let counter = 1;
            const MAX_ATTEMPTS = 5; // Reduced for testing
            while (counter <= MAX_ATTEMPTS && await checkUsername(u)) {
                console.log(`Collision detected for: ${u}, trying next...`);
                u = `${base}${counter++}`;
            }
            if (counter > MAX_ATTEMPTS) {
                u = `${base}_${crypto.randomUUID().split('-')[0]}`;
                console.log(`Max attempts reached. Generated unique: ${u}`);
            }
            return u;
        };

        // Create a user with a specific username to force collision
        const collisionBase = `collision_${Date.now()}`;
        await client.query(
            `INSERT INTO users (user_id, email, username, password_hash, institution_id, college_domain) 
             VALUES ($1, $2, $3, $4, $5, $6)`,
            [crypto.randomUUID(), `c1_${Date.now()}@${testDomain}`, collisionBase, 'hash', institutionId, testDomain]
        );
        console.log(`Seeded user with username: ${collisionBase}`);

        const newUsername = await generateUsername(collisionBase);
        console.log(`Resolved username: ${newUsername}`);
        if (newUsername !== collisionBase) console.log('SUCCESS: Collision resolved.');

        // Cleanup
        await client.query("DELETE FROM users WHERE email LIKE 'tester_%' OR email LIKE 'c1_%'");
        console.log('\nCleanup complete.');

    } catch (err) {
        console.error('Error during test:', err.stack);
    } finally {
        await client.end();
    }
}

main();
