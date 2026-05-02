"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RealtimeGateway = void 0;
const websockets_1 = require("@nestjs/websockets");
const socket_io_1 = require("socket.io");
const jwt_1 = require("@nestjs/jwt");
/**
 * RealtimeGateway
 *
 * FIX (Apr 25 2026):
 *  - BUG-06: handleSubscribeTicker no longer falls back to hardcoded 'iift.edu'.
 *    Unauthenticated clients now receive subscription_error instead of joining
 *    IIFT-D rooms — fixing a multi-tenant data isolation breach.
 */
let RealtimeGateway = class RealtimeGateway {
    constructor(jwtService) {
        this.jwtService = jwtService;
    }
    handleConnection(client) {
        const token = client.handshake.auth?.token;
        if (token) {
            try {
                const payload = this.jwtService.verify(token);
                if (payload.collegeDomain) {
                    client.data.collegeDomain = payload.collegeDomain;
                    client.join(`domain:${payload.collegeDomain}`);
                }
            }
            catch (e) {
                // Invalid token — collegeDomain stays undefined, subscription will be rejected below.
            }
        }
        console.log(`Client connected: ${client.id} [Domain: ${client.data.collegeDomain || 'UNAUTHENTICATED'}]`);
    }
    handleDisconnect(client) {
        console.log(`Client disconnected: ${client.id}`);
    }
    handleSubscribeTicker(client, data) {
        const domain = client.data.collegeDomain;
        if (!domain) {
            return { event: 'subscription_error', message: 'Authentication required to subscribe to ticker.' };
        }
        client.join(`ticker:${domain}:${data.ticker_id}`);
        return { event: 'subscribed', ticker_id: data.ticker_id };
    }
    handleUnsubscribeTicker(client, data) {
        const domain = client.data.collegeDomain;
        if (!domain) {
            return { event: 'subscription_error', message: 'Authentication required.' };
        }
        client.leave(`ticker:${domain}:${data.ticker_id}`);
        return { event: 'unsubscribed', ticker_id: data.ticker_id };
    }
    broadcastPriceUpdate(domain, tickerId, price, supply, change24h, volume) {
        this.server.to(`ticker:${domain}:${tickerId}`).emit('price_update', {
            ticker_id: tickerId, price, supply, change_24h: change24h, volume, timestamp: Date.now(),
        });
    }
    broadcastTickerTape(domain, tickers) {
        this.server.to(`domain:${domain}`).emit('ticker_tape', { tickers, timestamp: Date.now() });
    }
    broadcastPulse(domain, tickerId, txType) {
        this.server.to(`domain:${domain}`).emit('pulse', { ticker_id: tickerId, tx_type: txType, timestamp: Date.now() });
    }
    broadcastPropUpdate(domain, eventId, yesPool, noPool) {
        this.server.to(`domain:${domain}`).emit('prop_update', { event_id: eventId, yes_pool: yesPool, no_pool: noPool, timestamp: Date.now() });
    }
};
exports.RealtimeGateway = RealtimeGateway;
__decorate([
    (0, websockets_1.WebSocketServer)(),
    __metadata("design:type", socket_io_1.Server)
], RealtimeGateway.prototype, "server", void 0);
__decorate([
    (0, websockets_1.SubscribeMessage)('subscribe_ticker'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleSubscribeTicker", null);
__decorate([
    (0, websockets_1.SubscribeMessage)('unsubscribe_ticker'),
    __param(0, (0, websockets_1.ConnectedSocket)()),
    __param(1, (0, websockets_1.MessageBody)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [socket_io_1.Socket, Object]),
    __metadata("design:returntype", void 0)
], RealtimeGateway.prototype, "handleUnsubscribeTicker", null);
exports.RealtimeGateway = RealtimeGateway = __decorate([
    (0, websockets_1.WebSocketGateway)({
        cors: { origin: '*' },
        namespace: '/market',
    }),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], RealtimeGateway);
