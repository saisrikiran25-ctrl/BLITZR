import {
    WebSocketGateway,
    WebSocketServer,
    SubscribeMessage,
    MessageBody,
    ConnectedSocket,
    OnGatewayConnection,
    OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';

/**
 * RealtimeGateway
 *
 * FIX (Apr 25 2026):
 *  - BUG-06: handleSubscribeTicker no longer falls back to hardcoded 'iift.edu'.
 *    Unauthenticated clients now receive subscription_error instead of joining
 *    IIFT-D rooms — fixing a multi-tenant data isolation breach.
 */
@WebSocketGateway({
    cors: { origin: '*' },
    namespace: '/market',
})
export class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    @WebSocketServer()
    server: Server;

    constructor(private readonly jwtService: JwtService) {}

    handleConnection(client: Socket) {
        const token = client.handshake.auth?.token;
        if (token) {
            try {
                const payload = this.jwtService.verify(token);
                if (payload.collegeDomain) {
                    client.data.collegeDomain = payload.collegeDomain;
                    client.join(`domain:${payload.collegeDomain}`);
                }
            } catch (e) {
                // Invalid token — collegeDomain stays undefined, subscription will be rejected below.
            }
        }
        console.log(`Client connected: ${client.id} [Domain: ${client.data.collegeDomain || 'UNAUTHENTICATED'}]`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    @SubscribeMessage('subscribe_ticker')
    handleSubscribeTicker(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { ticker_id: string },
    ) {
        const domain = client.data.collegeDomain;
        if (!domain) {
            return { event: 'subscription_error', message: 'Authentication required to subscribe to ticker.' };
        }
        client.join(`ticker:${domain}:${data.ticker_id}`);
        return { event: 'subscribed', ticker_id: data.ticker_id };
    }

    @SubscribeMessage('unsubscribe_ticker')
    handleUnsubscribeTicker(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { ticker_id: string },
    ) {
        const domain = client.data.collegeDomain;
        if (!domain) {
            return { event: 'subscription_error', message: 'Authentication required.' };
        }
        client.leave(`ticker:${domain}:${data.ticker_id}`);
        return { event: 'unsubscribed', ticker_id: data.ticker_id };
    }

    broadcastPriceUpdate(domain: string, tickerId: string, price: number, supply: number, change24h: number, volume?: number) {
        this.server.to(`ticker:${domain}:${tickerId}`).emit('price_update', {
            ticker_id: tickerId, price, supply, change_24h: change24h, volume, timestamp: Date.now(),
        });
    }

    broadcastTickerTape(domain: string, tickers: Array<{ ticker_id: string; price: number; supply?: number; volume?: number; change_pct: number }>) {
        this.server.to(`domain:${domain}`).emit('ticker_tape', { tickers, timestamp: Date.now() });
    }

    broadcastPulse(domain: string, tickerId: string, txType: string) {
        this.server.to(`domain:${domain}`).emit('pulse', { ticker_id: tickerId, tx_type: txType, timestamp: Date.now() });
    }

    broadcastPropUpdate(domain: string, eventId: string, yesPool: number, noPool: number) {
        this.server.to(`domain:${domain}`).emit('prop_update', { event_id: eventId, yes_pool: yesPool, no_pool: noPool, timestamp: Date.now() });
    }
}
