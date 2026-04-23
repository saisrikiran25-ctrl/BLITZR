const { Client } = require('pg');
const bcrypt = require('bcrypt');
require('dotenv').config({ path: 'apps/backend/.env' });

async function seedModerators() {
    const client = new Client({
        host: process.env.DB_HOST,
        port: process.env.DB_PORT,
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
    });
    await client.connect();

    const institutionId = 'd1ea203d-ae80-4b86-9fb2-5a6e3b2e9bb8'; // IIFT Kakinada

    const moderators = [
        { username: 'Saksham', email: 'saksham_ipm25@iift.edu', password: 'testsaksham' },
        { username: 'Aarav', email: 'aarav_ipm25@iift.edu', password: 'testaarav' },
        { username: 'SaiK', email: 'saisrikiran_ipm25@iift.edu', password: 'testsaikiran' },
    ];

    try {
        console.log('Starting moderator seeding...');
        for (const mod of moderators) {
            // Delete existing to enforce strict update
            await client.query('DELETE FROM users WHERE email = $1', [mod.email]);
            await client.query('DELETE FROM users WHERE username = $1 AND institution_id = $2', [mod.username, institutionId]);

            const salt = await bcrypt.genSalt(12);
            const hash = await bcrypt.hash(mod.password, salt);

            await client.query(
                `INSERT INTO users (email, username, display_name, password_hash, institution_id, credibility_score, tos_accepted) 
                 VALUES ($1, $2, $3, $4, $5, $6, $7)`,
                [mod.email, mod.username, mod.username, hash, institutionId, 100, true]
            );
            console.log(`Seeded user: ${mod.username} (${mod.email})`);
        }
        console.log('Moderator seeding complete.');
    } catch (err) {
        console.error('Error seeding moderators:', err);
    } finally {
        await client.end();
    }
}

seedModerators();
