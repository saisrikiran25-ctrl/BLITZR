import { Controller, Get, Query, UseGuards, Request } from '@nestjs/common';
import { PropMarketService } from './prop-market.service';
import { JwtOrAdminGuard } from '../../common/guards/jwt-or-admin.guard';

@Controller('markets')
export class MarketsController {
    constructor(private readonly propMarketService: PropMarketService) { }

    @UseGuards(JwtOrAdminGuard)
    @Get()
    async getMarkets(
        @Request() req: any,
        @Query('scope') scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL' | 'ALL' = 'LOCAL',
    ) {
        if (req.user?.userId) {
            return this.propMarketService.getActiveEvents(req.user.userId, scope);
        }
        return this.propMarketService.getActiveEventsForInstitution(req.user?.institutionId, scope);
    }
}
