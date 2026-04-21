"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
async function bootstrap() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const dataSource = app.get(typeorm_1.DataSource);
    console.log("Database initialized. Building schema diff...");
    // Generates the SQL statements that TypeORM wants to execute to sync the DB to match entities.
    const sqlInMemory = await dataSource.driver.createSchemaBuilder().log();
    console.log("--- MISSING SCHEMA SYNC QUERIES ---");
    if (sqlInMemory.upQueries.length === 0) {
        console.log("No missing queries! Database matches exactly.");
    }
    else {
        sqlInMemory.upQueries.forEach(q => console.log(q.query));
    }
    await app.close();
}
bootstrap().catch(console.error);
