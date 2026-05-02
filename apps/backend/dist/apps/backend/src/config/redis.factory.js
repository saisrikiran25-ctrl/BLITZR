"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = createRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Creates a production-safe ioredis instance.
 * Handles TLS for DigitalOcean Managed Valkey (rediss://) which uses
 * self-signed certificates that require rejectUnauthorized: false.
 */
function createRedisClient(url, name = 'Redis') {
    const isTls = url.startsWith('rediss://');
    const client = new ioredis_1.default(url, {
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null, // Critical: Don't kill the process on request failure
        connectTimeout: 20000,
        enableOfflineQueue: true, // Allow commands to be queued while reconnecting
        lazyConnect: true,
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
        }
        else {
            console.error(`⚠️ [${name}] Redis Error:`, err.message);
        }
    });
    client.on('connect', () => {
        console.log(`📡 [${name}] Connected to Redis`);
    });
    return client;
}
