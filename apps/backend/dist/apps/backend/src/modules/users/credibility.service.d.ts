import { DataSource } from 'typeorm';
export declare class CredibilityService {
    private readonly dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    /**
     * Increment credibility by 10 points when a user's prop bet wins.
     */
    onPropBetWon(userId: string): Promise<void>;
    /**
     * Increment credibility by 5 points if a factual post survives 72 hours without hitting the dispute threshold.
     */
    onPostSurvived(postId: string): Promise<void>;
    /**
     * Increment credibility by 5 points when a flagged post is manually cleared by the Dean.
     */
    onPostCleared(postId: string): Promise<void>;
    /**
     * Decrement credibility by 15 points if a post is manually removed by the Dean for policy violation.
     */
    onPostRemoved(postId: string): Promise<void>;
    /**
     * Core score adjustment executing inside a transaction safely.
     * Score is bound between 0 (absolute bottom) and an upper bound, typically no cap but we start at 50.
     */
    private adjustScore;
}
