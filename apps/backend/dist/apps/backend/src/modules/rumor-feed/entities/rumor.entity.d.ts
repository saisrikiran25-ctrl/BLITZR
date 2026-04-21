import { UserEntity } from '../../users/entities/user.entity';
export declare class RumorEntity {
    post_id: string;
    author_id: string;
    author: UserEntity;
    ghost_id: string;
    text: string;
    tagged_tickers: string[];
    price_snapshot: Record<string, number>;
    post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL';
    visibility: 'PUBLIC' | 'PENDING' | 'HIDDEN' | 'REMOVED';
    risk_score: number;
    market_impact_triggered: boolean;
    moderation_flag: string | null;
    credibility_rewarded: boolean;
    status: 'VISIBLE' | 'PENDING_REVIEW' | 'MODERATED' | 'DELETED';
    toxicity_score: number;
    upvotes: number;
    downvotes: number;
    is_pinned: boolean;
    pinned_until: Date;
    college_domain: string;
    created_at: Date;
}
