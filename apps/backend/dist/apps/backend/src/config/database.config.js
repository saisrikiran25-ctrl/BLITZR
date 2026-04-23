"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getDatabaseConfig = void 0;
const getDatabaseConfig = (configService) => {
    const databaseUrl = configService.get('DATABASE_URL');
    // Base configuration
    const baseConfig = {
        type: 'postgres',
        autoLoadEntities: true,
        synchronize: false, // NEVER true in production; use migrations
        logging: configService.get('NODE_ENV') === 'development',
        ssl: configService.get('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        extra: {
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: configService.get('NODE_ENV') === 'production'
                ? { rejectUnauthorized: false }
                : false,
        },
    };
    // If DATABASE_URL is provided, use it (recommended for production/DigitalOcean)
    if (databaseUrl) {
        return {
            ...baseConfig,
            url: databaseUrl,
        };
    }
    // Fallback to individual fields for local development
    return {
        ...baseConfig,
        host: configService.get('DB_HOST', 'localhost'),
        port: configService.get('DB_PORT', 5432),
        username: configService.get('DB_USERNAME'),
        password: configService.get('DB_PASSWORD'),
        database: configService.get('DB_DATABASE'),
    };
};
exports.getDatabaseConfig = getDatabaseConfig;
