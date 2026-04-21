import { DataSource } from 'typeorm';

// We just need to define a basic DataSource connecting to the DB and importing the entities.
import { UserEntity } from './src/modules/users/entities/user.entity';
import { RumorEntity } from './src/modules/rumor-feed/entities/rumor.entity';
import { RumorVoteEntity } from './src/modules/rumor-feed/entities/rumor-vote.entity';
import { TickerEntity } from './src/modules/ipo/entities/ticker.entity';
import { HoldingEntity } from './src/modules/trading/entities/holding.entity';
import { TransactionEntity } from './src/modules/trading/entities/transaction.entity';
import { PropBetEntity } from './src/modules/prop-market/entities/prop-bet.entity';
import { PropEventEntity } from './src/modules/prop-market/entities/prop-event.entity';

const AppDataSource = new DataSource({
    type: 'postgres',
    host: 'localhost',
    port: 5434, // mapped port on host
    username: 'blitzr_admin',
    password: 'blitzr_dev_secret',
    database: 'blitzr_prime',
    entities: [
        UserEntity,
        RumorEntity,
        RumorVoteEntity,
        TickerEntity,
        HoldingEntity,
        TransactionEntity,
        PropBetEntity,
        PropEventEntity
    ],
    synchronize: false,
});

async function checkSchema() {
    await AppDataSource.initialize();
    console.log("Database initialized. Building schema diff...");
    
    const queryRunner = AppDataSource.createQueryRunner();
    // This generates the SQL statements that TypeORM wants to execute to sync the DB to match entities.
    const sqlInMemory = await AppDataSource.driver.createSchemaBuilder().log();
    
    console.log("--- MISSING SCHEMA SYNC QUERIES ---");
    if (sqlInMemory.upQueries.length === 0) {
        console.log("No missing queries! Database matches exactly.");
    } else {
        sqlInMemory.upQueries.forEach(q => console.log(q.query));
    }
    
    await AppDataSource.destroy();
}

checkSchema().catch(console.error);
