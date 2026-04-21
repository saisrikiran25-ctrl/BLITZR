import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
 */
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    server: Server;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    /**
     * Subscribe to a specific ticker's price updates.
     */
    handleSubscribeTicker(client: Socket, data: {
        ticker_id: string;
    }): {
        event: string;
        ticker_id: string;
    };
    /**
     * Unsubscribe from a ticker.
     */
    handleUnsubscribeTicker(client: Socket, data: {
        ticker_id: string;
    }): {
        event: string;
        ticker_id: string;
    };
    /**
     * Broadcast a price update to all subscribers of a ticker.
     * Called by TradingService after each trade.
     */
    broadcastPriceUpdate(domain: string, tickerId: string, price: number, supply: number, change24h: number, volume?: number): void;
    /**
     * Broadcast to the global "Ticker Tape" channel.
     * Sent every minute by Cron — includes supply for Global Market Cap recalculation.
     */
    broadcastTickerTape(domain: string, tickers: Array<{
        ticker_id: string;
        price: number;
        supply?: number;
        volume?: number;
        change_pct: number;
    }>): void;
    /**
     * Broadcast a "Pulse" blip (global trade indicator).
     */
    broadcastPulse(domain: string, tickerId: string, txType: string): void;
    /**
     * Broadcast prop event pool update.
     */
    broadcastPropUpdate(domain: string, eventId: string, yesPool: number, noPool: number): void;
}
