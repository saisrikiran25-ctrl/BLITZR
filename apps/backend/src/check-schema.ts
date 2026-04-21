import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log("Database initialized. Building schema diff...");
    
    // Generates the SQL statements that TypeORM wants to execute to sync the DB to match entities.
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
    
    console.log("--- MISSING SCHEMA SYNC QUERIES ---");
    if (sqlInMemory.upQueries.length === 0) {
        console.log("No missing queries! Database matches exactly.");
    } else {
        sqlInMemory.upQueries.forEach(q => console.log(q.query));
    }
    
    await app.close();
}

bootstrap().catch(console.error);
