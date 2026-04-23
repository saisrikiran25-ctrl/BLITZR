import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('rumor_posts')
export class RumorEntity {
    @PrimaryGeneratedColumn('uuid')
    post_id: string;

    @Column({ type: 'uuid' })
    author_id: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'author_id' })
    author: UserEntity;

    @Column({ type: 'varchar', length: 20 })
    ghost_id: string;

    @Column({ type: 'text', name: 'text' })
    text: string;

    // Array of $TICKER references parsed from content
    @Column({ type: 'varchar', array: true, default: '{}' })
    tagged_tickers: string[];

    // Snapshot of prices at time of broadcast
    @Column({ type: 'jsonb', default: {} })
    price_snapshot: Record<string, number>;

    // Group 2 Safety Enums
    @Column({
        type: 'enum',
        enum: ['FACTUAL_CLAIM', 'OPINION', 'NEUTRAL'],
        default: 'NEUTRAL',
    })
    post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL';

    @Column({
        type: 'enum',
        enum: ['PUBLIC', 'PENDING', 'HIDDEN', 'REMOVED'],
        default: 'PUBLIC',
    })
    visibility: 'PUBLIC' | 'PENDING' | 'HIDDEN' | 'REMOVED';

    @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.0 })
    risk_score: number;

    @Column({ type: 'boolean', default: false })
    market_impact_triggered: boolean;

    @Column({ type: 'varchar', length: 100, nullable: true })
    moderation_flag: string | null;

    @Column({ type: 'boolean', default: false })
    credibility_rewarded: boolean;

    // Moderation (legacy status column still present in base schema)
    @Column({
        type: 'enum',
        enum: ['VISIBLE', 'PENDING_REVIEW', 'MODERATED', 'DELETED'],
        default: 'VISIBLE',
    })
    status: 'VISIBLE' | 'PENDING_REVIEW' | 'MODERATED' | 'DELETED';

    @Column({ type: 'decimal', precision: 5, scale: 4, nullable: true })
    toxicity_score: number;

    // Engagement
    @Column({ type: 'integer', default: 0 })
    upvotes: number;

    @Column({ type: 'integer', default: 0 })
    downvotes: number;

    // Paid features
    @Column({ type: 'boolean', default: false })
    is_pinned: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    pinned_until: Date;

    // RLMT Domain Partition
    @Column({ type: 'varchar', length: 100, default: 'iift.edu' })
    college_domain: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
