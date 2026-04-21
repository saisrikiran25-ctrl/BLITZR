import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => ({
    type: 'postgres',
    url: configService.get<string>('DATABASE_URL'),
    host: configService.get<string>('DB_HOST', 'localhost'),
    port: configService.get<number>('DB_PORT', 5432),
    username: configService.get<string>('DB_USERNAME', 'blitzr_admin'),
    password: configService.get<string>('DB_PASSWORD', 'blitzr_dev_secret'),
    database: configService.get<string>('DB_DATABASE', 'blitzr_prime'),
    autoLoadEntities: true,
    synchronize: false, // NEVER true in production; use migrations
    logging: configService.get<string>('NODE_ENV') === 'development',
    // Connection pool settings for high-concurrency
    extra: {
        max: 20,                  // Max pool connections
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 5000,
    },
});
