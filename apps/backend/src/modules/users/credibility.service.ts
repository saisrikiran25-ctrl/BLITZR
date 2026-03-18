import { Injectable, Logger } from '@nestjs/common';
import { DataSource } from 'typeorm';

@Injectable()
export class CredibilityService {
    private readonly logger = new Logger(CredibilityService.name);

    constructor(private readonly dataSource: DataSource) {}

    /**
     * Increment credibility by 10 points when a user's prop bet wins.
     */
    async onPropBetWon(userId: string): Promise<void> {
        await this.adjustScore(userId, 10, 'Prop Bet Won');
    }

    /**
     * Increment credibility by 5 points if a factual post survives 72 hours without hitting the dispute threshold.
     */
    async onPostSurvived(postId: string): Promise<void> {
        const [post] = await this.dataSource.query(
            `SELECT author_id FROM rumor_posts WHERE post_id = $1`,
            [postId],
        );
        if (post?.author_id) {
            await this.adjustScore(post.author_id, 5, 'Post Survived 72h');
        }
    }

    /**
     * Increment credibility by 5 points when a flagged post is manually cleared by the Dean.
     */
    async onPostCleared(postId: string): Promise<void> {
        const [post] = await this.dataSource.query(
            `SELECT author_id FROM rumor_posts WHERE post_id = $1`,
            [postId],
        );
        if (post?.author_id) {
            await this.adjustScore(post.author_id, 5, 'Post Cleared By Moderator');
        }
    }

    /**
     * Decrement credibility by 15 points if a post is manually removed by the Dean for policy violation.
     */
    async onPostRemoved(postId: string): Promise<void> {
        const [post] = await this.dataSource.query(
            `SELECT author_id FROM rumor_posts WHERE post_id = $1`,
            [postId],
        );
        if (post?.author_id) {
            await this.adjustScore(post.author_id, -15, 'Post Removed By Moderator');
        }
    }

    /**
     * Core score adjustment executing inside a transaction safely.
     * Score is bound between 0 (absolute bottom) and an upper bound, typically no cap but we start at 50.
     */
    private async adjustScore(userId: string, delta: number, reason: string): Promise<void> {
        const queryRunner = this.dataSource.createQueryRunner();
        await queryRunner.connect();
        await queryRunner.startTransaction();

        try {
            // Update score with GREATEST(0, ... )
            await queryRunner.manager.query(
                `UPDATE users 
                 SET credibility_score = GREATEST(0, credibility_score + $1)
                 WHERE user_id = $2`,
                [delta, userId]
            );

            this.logger.log(`Credibility adjustment: delta=${delta} for user=${userId} reason='${reason}'`);

            await queryRunner.commitTransaction();
        } catch (error) {
            this.logger.error(`Failed to adjust credibility score for user ${userId}.`, error);
            await queryRunner.rollbackTransaction();
        } finally {
            await queryRunner.release();
        }
    }
}
