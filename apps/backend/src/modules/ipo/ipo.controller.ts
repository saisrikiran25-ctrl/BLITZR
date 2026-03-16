import { Controller, Post, Get, Param, Body, UseGuards, Request, Query } from '@nestjs/common';
import { IpoService } from './ipo.service';
import { IpoDelistService } from './ipo-delist.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('ipo')
export class IpoController {
    constructor(
        private readonly ipoService: IpoService,
        private readonly ipoDelistService: IpoDelistService,
    ) { }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async createIpo(
        @Request() req: any,
        @Body() body: { ticker_symbol: string; category?: string },
    ) {
        return this.ipoService.createIpo(req.user.userId, req.user.collegeDomain, body.ticker_symbol, body.category);
    }

    /**
     * Panic Button — Delist IPO (PRD §7.1)
     */
    @UseGuards(JwtAuthGuard)
    @Post('delist')
    async delistIpo(@Request() req: any) {
        return this.ipoDelistService.delistIpo(req.user.userId);
    }

    /**
     * Nuke a Prop Market (costs 2000 Chips)
     */
    @UseGuards(JwtAuthGuard)
    @Post('nuke/:eventId')
    async nukePropMarket(@Request() req: any, @Param('eventId') eventId: string) {
        return this.ipoDelistService.nukePropMarket(req.user.userId, req.user.collegeDomain, eventId);
    }

    /**
     * Buy Shoutout (pin rumor for 10 min, costs 500 Chips)
     */
    @UseGuards(JwtAuthGuard)
    @Post('shoutout/:rumorId')
    async buyShoutout(@Request() req: any, @Param('rumorId') rumorId: string) {
        return this.ipoDelistService.buyShoutout(req.user.userId, req.user.collegeDomain, rumorId);
    }

    /**
     * Buy Golden Border (costs 1000 Creds)
     */
    @UseGuards(JwtAuthGuard)
    @Post('golden-border')
    async buyGoldenBorder(@Request() req: any) {
        return this.ipoDelistService.buyGoldenBorder(req.user.userId);
    }

    @UseGuards(JwtAuthGuard)
    @Get('tickers')
    async getActiveTickers(@Request() req: any) {
        return this.ipoService.getActiveTickers(req.user.collegeDomain);
    }

    @UseGuards(JwtAuthGuard)
    @Get('ticker/:id')
    async getTicker(@Request() req: any, @Param('id') id: string) {
        return this.ipoService.getTicker(req.user.collegeDomain, id);
    }

    @UseGuards(JwtAuthGuard)
    @Get('holdings')
    async getUserHoldings(@Request() req: any) {
        return this.ipoService.getUserHoldings(req.user.userId);
    }
}
