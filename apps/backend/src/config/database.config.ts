import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';

export const getDatabaseConfig = (
    configService: ConfigService,
): TypeOrmModuleOptions => {
    const databaseUrl = configService.get<string>('DATABASE_URL');
    
    // Base configuration
    const baseConfig: TypeOrmModuleOptions = {
        type: 'postgres',
        autoLoadEntities: true,
        synchronize: false, // NEVER true in production; use migrations
        logging: configService.get<string>('NODE_ENV') === 'development',
        ssl: configService.get<string>('NODE_ENV') === 'production'
            ? { rejectUnauthorized: false }
            : false,
        extra: {
            max: 10,
            idleTimeoutMillis: 30000,
            connectionTimeoutMillis: 10000,
            ssl: configService.get<string>('NODE_ENV') === 'production'
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
        host: configService.get<string>('DB_HOST', 'localhost'),
        port: configService.get<number>('DB_PORT', 5432),
        username: configService.get<string>('DB_USERNAME'),
        password: configService.get<string>('DB_PASSWORD'),
        database: configService.get<string>('DB_DATABASE'),
    };
};

