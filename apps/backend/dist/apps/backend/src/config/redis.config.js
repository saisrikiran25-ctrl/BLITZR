"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getRedisConfig = void 0;
const getRedisConfig = (configService) => ({
    host: configService.get('REDIS_HOST', 'localhost'),
    port: configService.get('REDIS_PORT', 6379),
});
exports.getRedisConfig = getRedisConfig;
