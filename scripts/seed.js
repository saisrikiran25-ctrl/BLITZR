const { Client } = require('pg');
const bcrypt = require('bcrypt');
const { v4: uuidv4 } = require('uuid');

async function seed() {
    const client = new Client({
        host: 'localhost',
        port: 5433,
        user: 'blitzr_admin',
        password: 'blitzr_dev_secret',
        database: 'blitzr_prime',
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL for seeding...');

        // 1. Clear existing data
        console.log('Clearing old data...');
        // We use TRUNCATE with CASCADE to clear all tables in the correct order
        await client.query('TRUNCATE users, tickers, holdings, transactions, prop_events, prop_bets, rumors, ohlc_candles CASCADE');

        // 2. Create Sample Users
        console.log('Creating sample users...');
        const passwordHash = await bcrypt.hash('password123', 10);

        const users = [
            { id: uuidv4(), email: 'sai@iift.edu', username: 'SAI', displayName: 'Sai Kiran' },
            { id: uuidv4(), email: 'elon@stanford.edu', username: 'ELON', displayName: 'Elon Tusk' },
            { id: uuidv4(), email: 'vitalik@mit.edu', username: 'VITA', displayName: 'Vitalik' },
            { id: uuidv4(), email: 'zuck@harvard.edu', username: 'ZUCK', displayName: 'Mark Zuck' },
            { id: uuidv4(), email: 'admin@blitzr.edu', username: 'ADMIN', displayName: 'System Admin' },
        ];

        for (const u of users) {
            await client.query(
                'INSERT INTO users (user_id, email, username, display_name, password_hash, cred_balance, chip_balance) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [u.id, u.email, u.username, u.displayName, passwordHash, 1000, 2000]
            );
        }

        // 3. Create Tickers (IPOs)
        console.log('Creating tickers...');
        const tickers = [
            { id: '$SAI', owner_id: users[0].id, supply: 150, category: 'Engineering' },
            { id: '$ELON', owner_id: users[1].id, supply: 500, category: 'Technology' },
            { id: '$VITA', owner_id: users[2].id, supply: 300, category: 'Research' },
            { id: '$ZUCK', owner_id: users[3].id, supply: 450, category: 'Social Media' },
        ];

        for (const t of tickers) {
            await client.query(
                'INSERT INTO tickers (ticker_id, owner_id, current_supply, scaling_constant, category) VALUES ($1, $2, $3, $4, $5)',
                [t.id, t.owner_id, t.supply, 200, t.category]
            );
            // Update user status
            await client.query('UPDATE users SET is_ipo_active = TRUE WHERE user_id = $1', [t.owner_id]);

            // Initial holding for owner
            await client.query(
                'INSERT INTO holdings (user_id, ticker_id, shares_held, avg_buy_price) VALUES ($1, $2, $3, $4)',
                [t.owner_id, t.id, Math.floor(t.supply / 2), 10.0]
            );

            // Add some initial transactions to make charts look good
            console.log(`Adding transactions for ${t.id}...`);
            for (let i = 0; i < 5; i++) {
                await client.query(
                    'INSERT INTO transactions (user_id, ticker_id, tx_type, shares_quantity, amount, price_at_execution, supply_at_execution, currency) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)',
                    [users[Math.floor(Math.random() * 4)].id, t.id, 'BUY', 5, 50, 10.0, t.supply - (25 - i * 5), 'CRED']
                );
            }
        }

        // 4. Create Prop Events
        console.log('Creating prop events...');
        const events = [
            { title: 'Will the library stay open 24/7 during finals?', category: 'Campus', creator: users[4].id },
            { title: 'Cricket match: Hostel A vs Hostel B - Winner?', category: 'Sports', creator: users[0].id },
            { title: 'Will the Tech Fest get over 10,000 registrations?', category: 'Events', creator: users[1].id },
            { title: 'Is the new cafeteria menu better than the old one?', category: 'Opinion', creator: users[2].id },
        ];

        for (const e of events) {
            await client.query(
                'INSERT INTO prop_events (creator_id, title, category, status, expiry_timestamp, yes_pool, no_pool) VALUES ($1, $2, $3, $4, $5, $6, $7)',
                [e.creator, e.title, e.category, 'OPEN', new Date(Date.now() + 86400000 * 7), 500, 300]
            );
        }

        // 5. Create Rumors
        console.log('Creating rumors...');
        const rumors = [
            { author: users[0].id, ghost: 'ALPHA_1', content: 'Rumor has it $ELON is planning a guest lecture next week!', tags: ['$ELON'] },
            { author: users[2].id, ghost: 'BETA_42', content: 'The study rooms in Block C are being renovated. $VITA leaked the plans.', tags: ['$VITA'] },
            { author: users[3].id, ghost: 'GHOST_99', content: 'Is $SAI actually running for student council?', tags: ['$SAI'] },
            { author: users[1].id, ghost: 'WHISPER', content: 'The new prop market for the cricket match is looking hot.', tags: [] },
        ];

        for (const r of rumors) {
            await client.query(
                'INSERT INTO rumors (author_id, ghost_id, content, tagged_tickers) VALUES ($1, $2, $3, $4)',
                [r.author, r.ghost, r.content, r.tags]
            );
        }

        console.log('Seeding complete! 🚀');
    } catch (err) {
        console.error('Error seeding data:', err);
    } finally {
        await client.end();
    }
}

seed();
