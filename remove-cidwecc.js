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

async function removeEvent() {
    try {
        await ds.initialize();
        
        // Find the event
        const events = await ds.query("SELECT event_id, title FROM prop_events WHERE title = 'CIDWECC'");
        console.log('Found events:', events);
        
        if (events.length === 0) {
            console.log('No event found with title "CIDWECC"');
            process.exit(0);
        }

        for (const event of events) {
            const eventId = event.event_id;
            console.log(`Deleting event: ${event.title} (${eventId})`);
            
            // 1. Delete bets
            await ds.query("DELETE FROM prop_bets WHERE event_id = $1", [eventId]);
            console.log(`Deleted bets for ${eventId}`);
            
            // 2. Delete transactions referring to this event
            await ds.query("DELETE FROM transactions WHERE prop_event_id = $1", [eventId]);
            console.log(`Deleted transactions for ${eventId}`);
            
            // 3. Delete the event itself
            await ds.query("DELETE FROM prop_events WHERE event_id = $1", [eventId]);
            console.log(`Successfully removed event ${eventId}`);
        }
        
        process.exit(0);
    } catch (err) {
        console.error('Failed to remove event:', err);
        process.exit(1);
    }
}

removeEvent();
