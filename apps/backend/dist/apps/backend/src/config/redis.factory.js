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
        maxRetriesPerRequest: 3,
        connectTimeout: 10000,
        enableOfflineQueue: false,
        lazyConnect: false,
    });
    // CRITICAL: Prevent "Unhandled error event" crashes
    client.on('error', (err) => {
        console.warn(`⚠️ [${name}] Connection Error:`, err.message);
    });
    client.on('connect', () => {
        console.log(`📡 [${name}] Connected to Redis`);
    });
    return client;
}
