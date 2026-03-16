const { Client } = require('pg');

const client = new Client({
    user: 'blitzr_admin',
    host: 'localhost',
    database: 'blitzr_prime',
    password: 'blitzr_dev_secret',
    port: 5432,
});

client.connect()
    .then(() => {
        console.log('SUCCESS');
        client.end();
    })
    .catch(err => {
        console.error('ERROR:', err.message);
        process.exit(1);
    });
