import { OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
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
export declare class RealtimeGateway implements OnGatewayConnection, OnGatewayDisconnect {
    private readonly jwtService;
    server: Server;
    constructor(jwtService: JwtService);
    handleConnection(client: Socket): void;
    handleDisconnect(client: Socket): void;
    handleSubscribeTicker(client: Socket, data: {
        ticker_id: string;
    }): {
        event: string;
        message: string;
        ticker_id?: undefined;
    } | {
        event: string;
        ticker_id: string;
        message?: undefined;
    };
    handleUnsubscribeTicker(client: Socket, data: {
        ticker_id: string;
    }): {
        event: string;
        message: string;
        ticker_id?: undefined;
    } | {
        event: string;
        ticker_id: string;
        message?: undefined;
    };
    broadcastPriceUpdate(domain: string, tickerId: string, price: number, supply: number, change24h: number, volume?: number): void;
    broadcastTickerTape(domain: string, tickers: Array<{
        ticker_id: string;
        price: number;
        supply?: number;
        volume?: number;
        change_pct: number;
    }>): void;
    broadcastPulse(domain: string, tickerId: string, txType: string): void;
    broadcastPropUpdate(domain: string, eventId: string, yesPool: number, noPool: number): void;
}
