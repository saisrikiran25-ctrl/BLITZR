import { TradingService } from './trading.service';
import { TradeQueueService } from './trade-queue.service';
import { OhlcAggregationService } from './ohlc-aggregation.service';
export declare class TradingController {
    private readonly tradingService;
    private readonly tradeQueue;
    private readonly ohlcService;
    constructor(tradingService: TradingService, tradeQueue: TradeQueueService, ohlcService: OhlcAggregationService);
    previewBuy(req: any, body: {
        ticker_id: string;
        shares: number;
    }): Promise<{
        ticker_id: string;
        shares: number;
        direction: "BUY";
        gross_cost: number;
        burn_fee: number;
        dividend_fee: number;
        net_cost: number;
        price_before: number;
        price_after: number;
        supply_before: number;
        supply_after: number;
    }>;
    /**
     * B12: Buy via Redis trade queue — returns immediately with QUEUED status.
     */
    executeBuy(req: any, body: {
        ticker_id: string;
        shares: number;
    }): Promise<{
        status: "QUEUED";
        message: string;
    }>;
    /**
     * B12: Sell via Redis trade queue — returns immediately with QUEUED status.
     */
    executeSell(req: any, body: {
        ticker_id: string;
        shares: number;
    }): Promise<{
        status: "QUEUED";
        message: string;
    }>;
    /**
     * Get OHLC candles for chart rendering (PRD §6.2).
     */
    getCandles(req: any, tickerId: string, interval?: string, limit?: number): Promise<import("./entities/ohlc-candle.entity").OhlcCandleEntity[]>;
}
