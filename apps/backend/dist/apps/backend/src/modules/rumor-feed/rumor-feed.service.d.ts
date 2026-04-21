import { Repository, DataSource } from 'typeorm';
import { RumorEntity } from './entities/rumor.entity';
import { RumorVoteEntity } from './entities/rumor-vote.entity';
import { ClassifierService } from './classifier.service';
import { BondingCurveService } from '../ipo/bonding-curve.service';
import { MarketMonitorService } from './market-monitor.service';
import { ModerationService } from './moderation.service';
import { NotificationService } from '../../common/services/notification.service';
export declare class RumorFeedService {
    private readonly rumorRepo;
    private readonly voteRepo;
    private readonly dataSource;
    private readonly classifierService;
    private readonly bondingCurve;
    private readonly marketMonitorService;
    private readonly moderationService;
    private readonly notificationService;
    constructor(rumorRepo: Repository<RumorEntity>, voteRepo: Repository<RumorVoteEntity>, dataSource: DataSource, classifierService: ClassifierService, bondingCurve: BondingCurveService, marketMonitorService: MarketMonitorService, moderationService: ModerationService, notificationService: NotificationService);
    /**
     * Create a new anonymous rumor post.
     */
    createPost(authorId: string, collegeDomain: string, text: string): Promise<{
        post: RumorEntity;
        visibility: "PUBLIC";
    }>;
    /**
     * Get the rumor feed (newest first).
     */
    getFeed(collegeDomain: string, page?: number, limit?: number): Promise<RumorEntity[]>;
    /**
     * Upvote a rumor.
     */
    upvote(userId: string, collegeDomain: string, postId: string): Promise<RumorEntity>;
    /**
     * Downvote a rumor.
     */
    downvote(userId: string, collegeDomain: string, postId: string): Promise<RumorEntity>;
    /**
     * Core atomic voting ledger logic.
     * Enforces single-vote rule & handles vote-swapping.
     */
    private handleVote;
    private generateGhostId;
    /**
     * Community Dispute System (Task B10)
     */
    disputePost(userId: string, postId: string): Promise<{
        success: boolean;
        total_disputes: number;
    }>;
}
