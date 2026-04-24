import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { TradingService } from './trading.service';
import { TradeQueueService } from './trade-queue.service';
import { OhlcAggregationService } from './ohlc-aggregation.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('trading')
export class TradingController {
    constructor(
        private readonly tradingService: TradingService,
        private readonly tradeQueue: TradeQueueService,
        private readonly ohlcService: OhlcAggregationService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('preview/buy')
    async previewBuy(@Request() req: any, @Body() body: { ticker_id: string; shares: number }) {
        return this.tradingService.previewBuy(req.user.collegeDomain, body.ticker_id, body.shares);
    }

    /**
     * B12: Buy via Redis trade queue — returns immediately with QUEUED status.
     */
    @UseGuards(JwtAuthGuard)
    @Post('buy')
    async executeBuy(
        @Request() req: any,
        @Body() body: { ticker_id: string; shares: number },
    ) {
        return this.tradingService.executeBuy(
            req.user.userId,
            req.user.collegeDomain,
            body.ticker_id,
            body.shares,
        );
    }

    /**
     * B12: Sell via Redis trade queue — returns immediately with QUEUED status.
     */
    @UseGuards(JwtAuthGuard)
    @Post('sell')
    async executeSell(
        @Request() req: any,
        @Body() body: { ticker_id: string; shares: number },
    ) {
        return this.tradingService.executeSell(
            req.user.userId,
            req.user.collegeDomain,
            body.ticker_id,
            body.shares,
        );
    }

    /**
     * Get OHLC candles for chart rendering (PRD §6.2).
     */
    @UseGuards(JwtAuthGuard)
    @Get('candles/:tickerId')
    async getCandles(
        @Request() req: any,
        @Param('tickerId') tickerId: string,
        @Query('interval') interval: string = '1h',
        @Query('limit') limit: number = 100,
    ) {
        return this.ohlcService.getCandles(req.user.collegeDomain, tickerId, interval, limit);
    }
}
