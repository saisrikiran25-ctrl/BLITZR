import { Controller, Post, Get, Body, Query, UseGuards, Request, Param } from '@nestjs/common';
import { CreateRumorDto } from './dto/create-rumor.dto';
import { RumorFeedService } from './rumor-feed.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('rumors')
export class RumorFeedController {
    constructor(private readonly rumorFeedService: RumorFeedService) { }

    private mapToDto(rumor: any) {
        return {
            ...rumor,
            rumor_id: rumor.post_id,
            content: rumor.text,
            // Ensure numbers are numbers for the frontend
            upvotes: Number(rumor.upvotes),
            downvotes: Number(rumor.downvotes),
        };
    }

    @UseGuards(JwtAuthGuard)
    @Post()
    async createPost(@Request() req: any, @Body() body: CreateRumorDto) {
        const text = body.text || body.content;
        const result = await this.rumorFeedService.createPost(req.user.userId, req.user.collegeDomain, text || '');
        return {
            ...result,
            post: this.mapToDto(result.post),
        };
    }

    @UseGuards(JwtAuthGuard)
    @Get()
    async getFeed(@Request() req: any, @Query('page') page: number = 1, @Query('limit') limit: number = 20) {
        const feed = await this.rumorFeedService.getFeed(req.user.collegeDomain, page, limit);
        return feed.map(r => this.mapToDto(r));
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/upvote')
    async upvote(@Param('id') id: string, @Request() req: any) {
        const result = await this.rumorFeedService.upvote(req.user.userId, req.user.collegeDomain, id);
        return this.mapToDto(result);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/downvote')
    async downvote(@Param('id') id: string, @Request() req: any) {
        const result = await this.rumorFeedService.downvote(req.user.userId, req.user.collegeDomain, id);
        return this.mapToDto(result);
    }

    @UseGuards(JwtAuthGuard)
    @Post(':id/dispute')
    async dispute(@Param('id') id: string, @Request() req: any) {
        return this.rumorFeedService.disputePost(req.user.userId, id);
    }
}
