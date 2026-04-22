import Redis from 'ioredis';

/**
 * Creates a production-safe ioredis instance.
 * Handles TLS for DigitalOcean Managed Valkey (rediss://) which uses
 * self-signed certificates that require rejectUnauthorized: false.
 */
export function createRedisClient(url: string): Redis {
    const isTls = url.startsWith('rediss://');
    return new Redis(url, {
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        enableOfflineQueue: false,
        lazyConnect: false,
    });
}
