"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const app_module_1 = require("./app.module");
const typeorm_1 = require("typeorm");
const migration_runner_1 = require("./config/migration-runner");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    // Run native migrations before starting the server
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
