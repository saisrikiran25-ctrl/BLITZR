"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
const migration_runner_1 = require("./config/migration-runner");
async function bootstrap() {
    console.log('--- SYSTEM ENVIRONMENT DIAGNOSTICS ---');
    const criticalVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'GOOGLE_WEB_CLIENT_ID'];
    criticalVars.forEach(v => {
        const val = process.env[v];
        if (!val)
            console.warn(`⚠️  MISSING ENV VAR: ${v}`);
        else {
            const masked = val.length > 10 ? val.substring(0, 5) + '...' + val.substring(val.length - 5) : '********';
            console.log(`✅ ${v} found: ${masked}`);
        }
    });
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    const dataSource = app.get(typeorm_1.DataSource);
    await (0, migration_runner_1.runNativeMigrations)(dataSource);
    // Global prefix for all API routes
    app.setGlobalPrefix('api/v1');
    // Enable CORS for React Native mobile app
    app.enableCors({
        origin: '*', // Restrict in production
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    // Global validation pipe with transformation
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: false,
        transform: true,
        transformOptions: {
            enableImplicitConversion: true,
        },
    }));
    const port = 3001;
    await app.listen(port);
    console.log(`🚀 BLITZR-PRIME backend running on port ${port}`);
}
bootstrap();
