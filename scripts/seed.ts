import { Client } from 'pg';
import * as bcrypt from 'bcrypt';
import { v4 as uuidv4 } from 'uuid';

async function seed() {
    const client = new Client({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '5434', 10),
        user: process.env.DB_USERNAME || 'blitzr_admin',
        password: process.env.DB_PASSWORD || 'blitzr_dev_secret',
        database: process.env.DB_DATABASE || 'blitzr_prime',
    });

    try {
        await client.connect();
        console.log('Connected to PostgreSQL for seeding...');

        // 1. Clear existing data (caution: user asked for temporary data)
        console.log('Clearing old data...');
        await client.query('TRUNCATE users, tickers, holdings, transactions, prop_events, prop_bets, rumors CASCADE');

        // 2. Create Sample Users
        console.log('Creating sample users...');
        const passwordHash = await bcrypt.hash('password123', 10);

        const users = [
            { id: uuidv4(), email: 'sai@iift.edu', username: 'SAI', displayName: 'Sai Kiran' },
            { id: uuidv4(), email: 'elon@stanford.edu', username: 'ELON', displayName: 'Elon Tusk' },
            { id: uuidv4(), email: 'vitalik@mit.edu', username: 'VITA', displayName: 'Vitalik' },
            { id: uuidv4(), email: 'zuck@harvard.edu', username: 'ZUCK', displayName: 'Mark' },
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
            { id: '$ELON', owner_id: users[1].id, supply: 500, category: 'Tech' },
            { id: '$VITA', owner_id: users[2].id, supply: 300, category: 'Crypto' },
            { id: '$ZUCK', owner_id: users[3].id, supply: 450, category: 'Social' },
        ];

        for (const t of tickers) {
            await client.query(
                'INSERT INTO tickers (ticker_id, owner_id, current_supply, category) VALUES ($1, $2, $3, $4)',
                [t.id, t.owner_id, t.supply, t.category]
            );
            // Update user status
            await client.query('UPDATE users SET is_ipo_active = TRUE WHERE user_id = $1', [t.owner_id]);

            // Initial holding for owner
            await client.query(
                'INSERT INTO holdings (user_id, ticker_id, shares_held, avg_buy_price) VALUES ($1, $2, $3, $4)',
                [t.owner_id, t.id, Math.floor(t.supply / 2), 10.0]
            );
        }

        // 4. Create Prop Events
        console.log('Creating prop events...');
        const events = [
            { title: 'Will the library stay open 24/7 during finals?', category: 'Campus Life', creator: users[4].id },
            { title: 'Next Tesla CEO announcement by end of year?', category: 'Tech', creator: users[1].id },
            { title: 'Eth 2.0 full sharding complete by July?', category: 'Crypto', creator: users[2].id },
        ];

        for (const e of events) {
            await client.query(
                'INSERT INTO prop_events (creator_id, title, category, expiry_timestamp, yes_pool, no_pool) VALUES ($1, $2, $3, $4, $5, $6)',
                [e.creator, e.title, e.category, new Date(Date.now() + 86400000 * 7), 5000, 3000]
            );
        }

        // 5. Create Rumors
        console.log('Creating rumors...');
        const rumors = [
            { author: users[0].id, ghost: 'GHOST_1', content: 'Hearing big things about $ELON moving to campus.', tags: ['$ELON'] },
            { author: users[2].id, ghost: 'GHOST_2', content: 'The cafeteria is serving sushi tomorrow. $SAI confirmed.', tags: ['$SAI'] },
            { author: users[3].id, ghost: 'GHOST_3', content: 'Is $VITA actually an AI? Discuss.', tags: ['$VITA'] },
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
