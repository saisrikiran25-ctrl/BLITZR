"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createRedisClient = createRedisClient;
const ioredis_1 = __importDefault(require("ioredis"));
/**
 * Creates a production-safe ioredis instance.
 *
 * KEY SETTINGS (Apr 25 2026 hotfix):
 *  - enableOfflineQueue: true  — commands queue while reconnecting (NO crash)
 *  - maxRetriesPerRequest: null — ioredis manages retries, not per-request limit
 *  - lazyConnect: false — auto-connects on create; no .connect() needed by callers
 *  - connectTimeout: 20000 — DO Managed Valkey needs extra headroom
 *  - retryStrategy: exponential backoff up to 3s
 */
function createRedisClient(url, name = 'Redis') {
    const isTls = url.startsWith('rediss://');
    const client = new ioredis_1.default(url, {
        tls: isTls ? { rejectUnauthorized: false } : undefined,
        maxRetriesPerRequest: null,
        connectTimeout: 20000,
        enableOfflineQueue: true,
        lazyConnect: false,
        retryStrategy(times) {
            const delay = Math.min(times * 200, 3000);
            return delay;
        },
        reconnectOnError(err) {
            if (err.message.includes('READONLY')) return true;
            return false;
        },
    });
    client.on('error', (err) => {
        if (err.message.includes('ETIMEDOUT') || err.message.includes('ECONNREFUSED') || err.message.includes('ENOTFOUND')) {
            console.warn(`\u26a0\ufe0f [${name}] Redis unreachable — retrying in background...`);
        } else {
            console.error(`\u26a0\ufe0f [${name}] Redis Error:`, err.message);
        }
    });
    client.on('connect', () => console.log(`\ud83d\udce1 [${name}] Connected to Redis`));
    client.on('ready', () => console.log(`\u2705 [${name}] Redis ready`));
    client.on('reconnecting', () => console.log(`\ud83d\udd04 [${name}] Reconnecting to Redis...`));
    return client;
}
