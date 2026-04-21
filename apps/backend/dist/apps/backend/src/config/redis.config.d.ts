import { ConfigService } from '@nestjs/config';
export interface RedisConfig {
    host: string;
    port: number;
}
export declare const getRedisConfig: (configService: ConfigService) => RedisConfig;
