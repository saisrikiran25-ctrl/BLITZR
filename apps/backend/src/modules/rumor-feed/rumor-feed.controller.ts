import { Controller, Post, Get, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { RumorFeedService } from './rumor-feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rumors')
export class RumorFeedController {
    constructor(private readonly rumorFeedService: RumorFeedService) { }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createRumor(@Request() req: any, @Body() body: { content: string }) {
        return this.rumorFeedService.createRumor(req.user.userId, req.user.collegeDomain, body.content);
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getFeed(@Request() req: any, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
        return this.rumorFeedService.getFeed(req.user.collegeDomain, page, limit);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/upvote')
    async upvote(@Param('id') id: string, @Request() req: any) {
        return this.rumorFeedService.upvote(req.user.userId, req.user.collegeDomain, id);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/downvote')
    async downvote(@Param('id') id: string, @Request() req: any) {
        return this.rumorFeedService.downvote(req.user.userId, req.user.collegeDomain, id);
    }
}
