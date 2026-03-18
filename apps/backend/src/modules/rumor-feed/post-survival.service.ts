import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { DataSource } from 'typeorm';
import { CredibilityService } from '../users/credibility.service';

@Injectable()
export class PostSurvivalService {
    private readonly logger = new Logger(PostSurvivalService.name);

    constructor(
        private readonly dataSource: DataSource,
        private readonly credibilityService: CredibilityService,
    ) { }

    @Cron('0 0 * * * *')
    async rewardSurvivedPosts() {
        const threshold = new Date(Date.now() - 72 * 60 * 60 * 1000);

        const posts = await this.dataSource.query(
            `SELECT post_id, created_at
             FROM rumor_posts
             WHERE post_type = 'FACTUAL_CLAIM'
               AND created_at <= $1
               AND credibility_rewarded = false`,
            [threshold],
        );

        for (const post of posts) {
            const [countRes] = await this.dataSource.query(
                `SELECT COUNT(*)::int AS count
                 FROM post_disputes
                 WHERE post_id = $1 AND created_at <= ($2::timestamptz + INTERVAL '72 hours')`,
                [post.post_id, post.created_at],
            );

            const disputeCount = Number(countRes?.count ?? 0);
            if (disputeCount < 30) {
                await this.credibilityService.onPostSurvived(post.post_id);
                await this.dataSource.query(
                    `UPDATE rumor_posts SET credibility_rewarded = true WHERE post_id = $1`,
                    [post.post_id],
                );
                this.logger.log(`Credibility reward granted for post ${post.post_id}`);
            }
        }
    }
}
