"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const getDatabaseConfig = (configService) => ({
    type: 'postgres',
    url: configService.get('DATABASE_URL'),
    autoLoadEntities: true,
    synchronize: false, // NEVER true in production; use migrations
    logging: configService.get('NODE_ENV') === 'development',
    ssl: configService.get('NODE_ENV') === 'production'
        ? { rejectUnauthorized: false }
        : false,
    // Connection pool settings for high-concurrency
    extra: {
        max: 10,
        idleTimeoutMillis: 30000,
        connectionTimeoutMillis: 10000,
        ssl: configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
    },
});
exports.getDatabaseConfig = getDatabaseConfig;
