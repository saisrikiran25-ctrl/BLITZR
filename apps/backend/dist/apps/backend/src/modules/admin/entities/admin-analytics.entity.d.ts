export declare class AdminAnalyticsEntity {
    snapshot_id: string;
    institution_id: string;
    dept_sentiment: Record<string, number>;
    avg_score_change: number;
    total_trades: number;
    active_users: number;
    flagged_posts: number;
    computed_at: Date;
}
