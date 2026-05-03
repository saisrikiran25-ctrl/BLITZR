import Redis from 'ioredis';

/**
 * Creates a production-safe ioredis instance.
 * Handles TLS for DigitalOcean Managed Valkey (rediss://) which uses
 * self-signed certificates that require rejectUnauthorized: false.
 */
export function createRedisClient(url: string, name: string = 'Redis'): Redis {
    if (!url) {
        console.error(`❌ [${name}] FATAL: Redis URL is undefined or empty!`);
        // We'll still return a client so it doesn't crash the whole app, 
        // but it will obviously fail to connect to anything.
        return new Redis('redis://invalid-host:6379', { lazyConnect: true });
    }
    // DigitalOcean Managed Redis uses port 25061 for TLS even if the protocol is 'redis://'

    const isTls = url.startsWith('rediss://') || url.includes(':25061');
    
    // Mask password in logs
    const maskedUrl = url.replace(/:[^:@]+@/, ':****@');
    console.log(`📡 [${name}] Connecting to: ${maskedUrl} (Detected TLS: ${isTls})`);

    const client = new Redis(url, {
        tls: isTls ? { 
            rejectUnauthorized: false,
            // Add servername to help with SNI issues in some environments
            servername: url.split('@')[1]?.split(':')[0]?.split('/')[0]
        } : undefined,

        maxRetriesPerRequest: null, // Critical: Don't kill the process on request failure
        connectTimeout: 5000,      // Reduced to prevent long hangs during startup
        enableOfflineQueue: true, // Allow commands to be queued while reconnecting
        lazyConnect: false,       // Auto-connect in background (Non-blocking)

        retryStrategy(times) {
            const delay = Math.min(times * 100, 3000);
            return delay;
        },
        reconnectOnError(err) {
            const targetError = 'READONLY';
            if (err.message.includes(targetError)) {
                return true;
            }
            return false;
        },
    });

    // CRITICAL: Prevent "Unhandled error event" crashes
    client.on('error', (err) => {
        // Log sparingly to avoid log flooding
        if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
            console.warn(`📡 [${name}] Redis is currently unreachable. Retrying in background...`);
        } else {
            console.error(`⚠️ [${name}] Redis Error:`, err.message);
        }
    });

    client.on('connect', () => {
        console.log(`📡 [${name}] Connected to Redis`);
    });

    return client;
}
