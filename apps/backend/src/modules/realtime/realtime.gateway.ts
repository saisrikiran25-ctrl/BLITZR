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
 * Socket.io WebSocket gateway for:
 * - Live price updates (Ticker Tape)
 * - Trade execution notifications
 * - Prop event pool changes
 * - The "Pulse" indicator (global trade blips)
 *
 * FIX (Apr 25 2026):
 *  - BUG-06: handleSubscribeTicker previously fell back to the hardcoded domain
 *    'iift.edu' when collegeDomain was missing (invalid/expired JWT token).
 *    This silently added unauthenticated clients from ANY institution to
 *    IIFT-D's private price update rooms — a multi-tenant data isolation breach.
 *    Fix: if collegeDomain is not present on the client, emit a subscription_error
 *    event and return without joining any room.
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
                // Invalid token silently ignored; collegeDomain remains undefined.
                // Subsequent subscription attempts will be rejected below.
            }
        }
        console.log(`Client connected: ${client.id} [Domain: ${client.data.collegeDomain || 'UNAUTHENTICATED'}]`);
    }

    handleDisconnect(client: Socket) {
        console.log(`Client disconnected: ${client.id}`);
    }

    /**
     * Subscribe to a specific ticker's price updates.
     * BUG-06 FIX: Reject subscription if collegeDomain is missing.
     * Do NOT fall back to a hardcoded domain — that leaks cross-tenant data.
     */
    @SubscribeMessage('subscribe_ticker')
    handleSubscribeTicker(
        @ConnectedSocket() client: Socket,
        @MessageBody() data: { ticker_id: string },
    ) {
        const domain = client.data.collegeDomain;
        if (!domain) {
            // Reject unauthenticated subscriptions instead of leaking into a hardcoded domain.
            return { event: 'subscription_error', message: 'Authentication required to subscribe to ticker.' };
        }
        client.join(`ticker:${domain}:${data.ticker_id}`);
        return { event: 'subscribed', ticker_id: data.ticker_id };
    }

    /**
     * Unsubscribe from a ticker.
     */
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

    /**
     * Broadcast a price update to all subscribers of a ticker.
     * Called by TradingService after each trade.
     */
    broadcastPriceUpdate(
        domain: string,
        tickerId: string,
        price: number,
        supply: number,
        change24h: number,
        volume?: number,
    ) {
        this.server.to(`ticker:${domain}:${tickerId}`).emit('price_update', {
            ticker_id: tickerId,
            price,
            supply,
            change_24h: change24h,
            volume,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast to the global "Ticker Tape" channel.
     * Sent every minute by Cron — includes supply for Global Market Cap recalculation.
     */
    broadcastTickerTape(
        domain: string,
        tickers: Array<{
            ticker_id: string;
            price: number;
            supply?: number;
            volume?: number;
            change_pct: number;
        }>,
    ) {
        this.server.to(`domain:${domain}`).emit('ticker_tape', { tickers, timestamp: Date.now() });
    }

    /**
     * Broadcast a "Pulse" blip (global trade indicator).
     */
    broadcastPulse(domain: string, tickerId: string, txType: string) {
        this.server.to(`domain:${domain}`).emit('pulse', {
            ticker_id: tickerId,
            tx_type: txType,
            timestamp: Date.now(),
        });
    }

    /**
     * Broadcast prop event pool update.
     */
    broadcastPropUpdate(domain: string, eventId: string, yesPool: number, noPool: number) {
        this.server.to(`domain:${domain}`).emit('prop_update', {
            event_id: eventId,
            yes_pool: yesPool,
            no_pool: noPool,
            timestamp: Date.now(),
        });
    }
}
