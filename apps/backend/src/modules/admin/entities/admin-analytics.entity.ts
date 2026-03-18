import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('admin_analytics')
export class AdminAnalyticsEntity {
    @PrimaryGeneratedColumn('uuid')
    snapshot_id: string;

    @Column({ type: 'uuid', nullable: true })
    institution_id: string;

    @Column({ type: 'jsonb', default: {} })
    dept_sentiment: Record<string, number>;

    @Column({ type: 'decimal', precision: 8, scale: 4, nullable: true })
    avg_score_change: number;

    @Column({ type: 'integer', nullable: true })
    total_trades: number;

    @Column({ type: 'integer', nullable: true })
    active_users: number;

    @Column({ type: 'integer', nullable: true })
    flagged_posts: number;

    @CreateDateColumn({ type: 'timestamptz' })
    computed_at: Date;
}
