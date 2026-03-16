import { ConfigService } from '@nestjs/config';

export interface RedisConfig {
    host: string;
    port: number;
}

export const getRedisConfig = (configService: ConfigService): RedisConfig => ({
    host: configService.get<string>('REDIS_HOST', 'localhost'),
    port: configService.get<number>('REDIS_PORT', 6379),
});
