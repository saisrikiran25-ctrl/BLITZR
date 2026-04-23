import { Controller, Post, Get, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { PropMarketService } from './prop-market.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { AdminJwtGuard } from '../admin/guards/admin-jwt.guard';
import { IsString, IsOptional, IsNumber, IsNotEmpty, IsDateString } from 'class-validator';
import { Type } from 'class-transformer';

class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsString()
    @IsOptional()
    description?: string;

    @IsString()
    @IsOptional()
    category?: string;

    @IsDateString()
    expiry_timestamp: string;

    @IsString()
    @IsOptional()
    referee_id?: string;

    @IsNumber()
    @IsOptional()
    @Type(() => Number)
    listing_fee?: number;

    @IsNumber()
    @IsNotEmpty()
    @Type(() => Number)
    initial_liquidity: number;
}

@Controller('prop-market')
export class PropMarketController {
    constructor(private readonly propMarketService: PropMarketService) { }

    @UseGuards(JwtAuthGuard)
    @Post('create')
    async createEvent(
        @Request() req: any,
        @Body() body: any,
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
    async getActiveEvents(
        @Request() req: any,
        @Query('scope') scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'ALL' = 'LOCAL',
    ) {
        return this.propMarketService.getActiveEvents(req.user.userId, scope);
    }

    /**
     * B4: Admin endpoint to create a national/regional prop market.
     * Protected by ADMIN_SECRET header.
     */
    @UseGuards(AdminJwtGuard)
    @Post('admin/create')
    async adminCreateMarket(
        @Request() req: any,
        @Body() body: {
            title: string;
            description?: string;
            category?: string;
            expiry_timestamp: string;
            scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL';
            institution_id?: string;
            options?: string[];
            featured?: boolean;
        },
    ) {
        const isAdmin = ['ADMIN', 'INSTITUTION_ADMIN'].includes(req.user.role);
        return this.propMarketService.createAdminMarket(
            req.user.adminId,
            isAdmin,
            body.title,
            body.description,
            body.category,
            new Date(body.expiry_timestamp),
            body.scope,
            body.institution_id ?? req.user.institutionId,
            body.options,
            body.featured ?? false,
        );
    }
}
