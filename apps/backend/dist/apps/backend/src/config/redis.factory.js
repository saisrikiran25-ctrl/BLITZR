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
 *
 * HOTFIX Apr 25 2026:
 *  - enableOfflineQueue: true  — commands queue while reconnecting, no crash
 *  - maxRetriesPerRequest: null — do not kill the process on request failure
 *  - lazyConnect: true          — caller must .connect() explicitly before use
 *  - connectTimeout: 20000      — DO Managed Valkey needs extra headroom
 */
function createRedisClient(url, name = 'Redis') {
    const isTls = url.startsWith('rediss://');
    const client = new ioredis_1.default(url, {
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null,
        connectTimeout: 20000,
        enableOfflineQueue: true,
        lazyConnect: true,
        retryStrategy(times) {
            const delay = Math.min(times * 100, 3000);
            return delay;
        },
        reconnectOnError(err) {
            if (err.message.includes('READONLY')) {
                return true;
            }
            return false;
        },
    });
    // CRITICAL: Prevent "Unhandled error event" process crash
    client.on('error', (err) => {
        if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED')) {
            console.warn(`\u26a0\ufe0f [${name}] Redis is currently unreachable. Retrying in background...`);
        } else {
            console.error(`\u26a0\ufe0f [${name}] Redis Error:`, err.message);
        }
    });
    client.on('connect', () => {
        console.log(`\ud83d\udce1 [${name}] Connected to Redis`);
    });
    return client;
}
