import {
    Entity,
    PrimaryColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('tickers')
export class TickerEntity {
    @PrimaryColumn({ type: 'varchar', length: 50 })
    ticker_id: string;

    @Column({ type: 'uuid' })
    owner_id: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'owner_id' })
    owner: UserEntity;

    // Bonding curve state — THIS IS THE CRITICAL FIELD LOCKED VIA FOR UPDATE
    @Column({ type: 'bigint', default: 1 })
    current_supply: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, default: 200.0 })
    scaling_constant: number;

    // Session-open price for NYSE-style % change calculation.
    // Set at IPO time, reset every 24h by the Cron job.
    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.005 })
    price_open: number;

    // Market data
    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.0 })
    total_volume: number;

    @Column({ type: 'bigint', default: 0 })
    total_trades: number;

    @Column({ type: 'integer', default: 0 })
    human_trades_1h: number;

    // Status
    @Column({
        type: 'enum',
        enum: ['ACTIVE', 'FROZEN', 'AUTO_FROZEN', 'PENDING', 'DELISTED'],
        default: 'ACTIVE',
    })
    status: 'ACTIVE' | 'FROZEN' | 'AUTO_FROZEN' | 'PENDING' | 'DELISTED';

    @Column({ type: 'timestamptz', nullable: true })
    frozen_until: Date;

    // Category for heatmap grouping
    @Column({ type: 'varchar', length: 100, nullable: true })
    category: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    // RLMT Domain Partition
    @Column({ type: 'varchar', length: 100, default: 'iift.edu' })
    college_domain: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
