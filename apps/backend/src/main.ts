import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { AppModule } from './app.module';
import { DataSource } from 'typeorm';
import { runNativeMigrations } from './config/migration-runner';

async function bootstrap() {
    console.log('--- SYSTEM ENVIRONMENT DIAGNOSTICS ---');
    const criticalVars = ['DATABASE_URL', 'REDIS_URL', 'JWT_SECRET', 'GOOGLE_WEB_CLIENT_ID'];
    criticalVars.forEach(v => {
        const val = process.env[v];
        if (!val) console.warn(`⚠️  MISSING ENV VAR: ${v}`);
        else {
            const masked = val.length > 10 ? val.substring(0, 5) + '...' + val.substring(val.length - 5) : '********';
            console.log(`✅ ${v} found: ${masked}`);
        }
    });

    const app = await NestFactory.create(AppModule);

    const dataSource = app.get(DataSource);
    await runNativeMigrations(dataSource);

    // Global prefix for all API routes
    app.setGlobalPrefix('api/v1');

    // Enable CORS for React Native mobile app
    app.enableCors({
        origin: '*', // Restrict in production
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });

    // Global validation pipe with transformation
    app.useGlobalPipes(
        new ValidationPipe({
            whitelist: true,
            forbidNonWhitelisted: false,
            transform: true,
            transformOptions: {
                enableImplicitConversion: true,
            },
        }),
    );

    const port = 3001;
    await app.listen(port);
    console.log(`🚀 BLITZR-PRIME backend running on port ${port}`);
}
bootstrap();
