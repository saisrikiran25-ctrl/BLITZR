import { NestFactory } from '@nestjs/core';
import { AppModule } from './src/app.module';
import { AuthService } from './src/modules/auth/auth.service';
import { DataSource } from 'typeorm';

async function auditAuth() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const authService = app.get(AuthService);
    const dataSource = app.get(DataSource);

    console.log("--- STARTING AUTH AUDIT ---");

    // Test Domain with Multiple Campuses (iift.edu)
    console.log("\nTesting domain: iift.edu (Multi-campus)");
    
    const domain = 'iift.edu';
    const institutions = await dataSource.query(
        'SELECT institution_id, name, short_code, email_domain FROM institutions WHERE email_domain = $1 AND verified = true',
        [domain]
    );
    console.log(`Found ${institutions.length} institutions for ${domain}`);
    institutions.forEach((i: any) => console.log(` - ${i.name} (${i.short_code})`));

    if (institutions.length > 1) {
        console.log("SUCCESS: Multi-campus detection working for database.");
    } else {
        console.log("FAILURE: Multi-campus detection failed.");
    }

    // Test Domain with Single Campus
    console.log("\nTesting domain: bits-pilani.ac.in (Multi-campus)");
    const bitsInstitutions = await dataSource.query(
        'SELECT institution_id, name, short_code, email_domain FROM institutions WHERE email_domain = $1 AND verified = true',
        [ 'bits-pilani.ac.in' ]
    );
    console.log(`Found ${bitsInstitutions.length} institutions for bits-pilani.ac.in`);

    // Check user creation logic (Short Code Sync)
    console.log("\nAudit: User creation logic");
    console.log("Checking if users table has college_domain column and if it stores short_codes.");
    const userSample = await dataSource.query('SELECT username, college_domain, institution_id FROM users WHERE college_domain IS NOT NULL LIMIT 3');
    console.table(userSample);
    
    console.log("\n--- AUDIT COMPLETE ---");
    await app.close();
}

auditAuth().catch(console.error);
