import Redis from 'ioredis';
/**
 * Creates a production-safe ioredis instance.
 * Handles TLS for DigitalOcean Managed Valkey (rediss://) which uses
 * self-signed certificates that require rejectUnauthorized: false.
 */
export declare function createRedisClient(url: string): Redis;
