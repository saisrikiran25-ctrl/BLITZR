import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('admin_analytics')
export class AdminAnalyticsEntity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0 })
    total_clout: number;

    @Column({ type: 'integer', default: 0 })
    active_users: number;

    @Column({ type: 'integer', default: 0 })
    flagged_posts_count: number;

    @CreateDateColumn({ type: 'timestamptz' })
    recorded_at: Date;
}
