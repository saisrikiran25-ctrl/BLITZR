import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { DataSource } from 'typeorm';

async function checkDb() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const dataSource = app.get(DataSource);

    console.log("--- INSTITUTIONS ---");
    const institutions = await dataSource.query('SELECT institution_id, name, short_code, email_domain, verified FROM institutions');
    console.table(institutions);

    await app.close();
}

checkDb().catch(console.error);
