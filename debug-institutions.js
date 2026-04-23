const { DataSource } = require('typeorm');
require('dotenv').config({ path: 'apps/backend/.env' });

const ds = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5434'),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
});

async function check() {
    try {
        await ds.initialize();
        const res = await ds.query('SELECT name, email_domain FROM institutions');
        console.log('INSTITUTIONS:', res);
        
        const users = await ds.query("SELECT email, username, institution_id FROM users WHERE email LIKE '%iift.edu'");
        console.log('IIFT USERS:', users);
        
        process.exit(0);
    } catch (err) {
        console.error(err);
        process.exit(1);
    }
}

check();
