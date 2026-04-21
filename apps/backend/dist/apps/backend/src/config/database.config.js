"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const getDatabaseConfig = (configService) => ({
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    host: configService.get('DB_HOST', 'localhost'),
    port: configService.get('DB_PORT', 5432),
    username: configService.get('DB_USERNAME', 'blitzr_admin'),
    password: configService.get('DB_PASSWORD', 'blitzr_dev_secret'),
    database: configService.get('DB_DATABASE', 'blitzr_prime'),
    autoLoadEntities: true,
    synchronize: false, // NEVER true in production; use migrations
    logging: configService.get('NODE_ENV') === 'development',
    // Connection pool settings for high-concurrency
    extra: {
        max: 20, // Max pool connections
        idleTimeoutMillis: 30000, // Close idle connections after 30s
        connectionTimeoutMillis: 5000,
    },
});
exports.getDatabaseConfig = getDatabaseConfig;
