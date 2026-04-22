import { io, Socket } from 'socket.io-client';
import { useMarketStore } from '../store/useMarketStore';
import { usePropStore } from '../store/usePropStore';
import { useAuthStore } from '../store/useAuthStore';

const WS_URL = 'wss://monkfish-app-r6nxh.ondigitalocean.app/market';

/**
 * WebSocket service for real-time data.
 * 
 * Channels:
 * - price_update: Per-ticker price changes
 * - ticker_tape: Top 10 volatile tickers
 * - pulse: Global trade blip indicator
 * - prop_update: Prop event pool changes
 */
class WebSocketService {
    private socket: Socket | null = null;

    connect() {
        if (this.socket?.connected) return;

        const token = useAuthStore.getState().token;

        this.socket = io(WS_URL, {
            transports: ['websocket'],
            reconnection: true,
            reconnectionAttempts: 10,
            reconnectionDelay: 1000,
            auth: { token },
        });

        this.socket.on('connect', () => {
            console.log('🔌 WebSocket connected');
            useMarketStore.getState().setConnected(true);

            // Re-subscribe to active tickers on reconnect/initial load
            const tickers = useMarketStore.getState().tickers || {};
            Object.keys(tickers).forEach(tickerId => {
                this.subscribeTicker(tickerId);
            });
        });

        this.socket.on('disconnect', () => {
            console.log('🔌 WebSocket disconnected');
            useMarketStore.getState().setConnected(false);
        });

        // Price update handler
        this.socket.on('price_update', (data: {
            ticker_id: string;
            price: number;
            supply: number;
            change_24h: number;
            volume?: number;
        }) => {
            useMarketStore.getState().updateTicker(data.ticker_id, {
                price: data.price,
                supply: data.supply,
                change_pct: data.change_24h,
                ...(data.volume !== undefined && { volume: data.volume }),
            });
        });

        // Ticker tape broadcast (every minute cron)
        this.socket.on('ticker_tape', (data: { tickers: any[] }) => {
            data.tickers.forEach(t => {
                useMarketStore.getState().updateTicker(t.ticker_id, {
                    price: t.price,
                    change_pct: t.change_pct,
                    // Include supply + volume so globalMarketCap recalculates
                    ...(t.supply !== undefined && { supply: t.supply }),
                    ...(t.volume !== undefined && { volume: t.volume }),
                });
            });
        });

        // Global pulse (trade blip)
        this.socket.on('pulse', (_data: { ticker_id: string; tx_type: string }) => {
            // Trigger pulse animation via store or event emitter
        });

        // Prop event pool update
        this.socket.on('prop_update', (data: {
            event_id: string;
            yes_pool: number;
            no_pool: number;
        }) => {
            usePropStore.getState().updateEventPools(data.event_id, data.yes_pool, data.no_pool);
        });
    }

    subscribeTicker(tickerId: string) {
        this.socket?.emit('subscribe_ticker', { ticker_id: tickerId });
    }

    unsubscribeTicker(tickerId: string) {
        this.socket?.emit('unsubscribe_ticker', { ticker_id: tickerId });
    }

    disconnect() {
        this.socket?.disconnect();
        this.socket = null;
    }
}

export const wsService = new WebSocketService();
