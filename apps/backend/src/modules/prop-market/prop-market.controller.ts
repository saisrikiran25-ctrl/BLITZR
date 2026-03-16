import { Controller, Post, Get, Body, Param, UseGuards, Request } from '@nestjs/common';
import { PropMarketService } from './prop-market.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('prop-market')
export class PropMarketController {
    constructor(private readonly propMarketService: PropMarketService) { }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async createEvent(
        @Request() req: any,
        @Body() body: {
            title: string;
            description?: string;
            category?: string;
            expiry_timestamp: string;
            referee_id?: string;
            listing_fee?: number;
            initial_liquidity: number;
        },
    ) {
        return this.propMarketService.createEvent(
            req.user.userId,
            req.user.collegeDomain,
            body.title,
            body.description,
            body.category,
            new Date(body.expiry_timestamp),
            body.referee_id,
            body.listing_fee,
            body.initial_liquidity,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('bet')
    async placeBet(
        @Request() req: any,
        @Body() body: { event_id: string; outcome: 'YES' | 'NO'; chip_amount: number },
    ) {
        return this.propMarketService.placeBet(
            req.user.userId,
            req.user.collegeDomain,
            body.event_id,
            body.outcome,
            body.chip_amount,
        );
    }

    @UseGuards(JwtAuthGuard)
    @Post('settle')
    async settleEvent(
        @Request() req: any,
        @Body() body: { event_id: string; winning_outcome: 'YES' | 'NO' },
    ) {
        return this.propMarketService.settleEvent(req.user.userId, req.user.collegeDomain, body.event_id, body.winning_outcome);
    }

    @UseGuards(JwtAuthGuard)
    @Get('events')
    async getActiveEvents(@Request() req: any) {
        return this.propMarketService.getActiveEvents(req.user.collegeDomain);
    }
}
