import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';

@Entity('prop_events')
export class PropEventEntity {
    @PrimaryGeneratedColumn('uuid')
    event_id: string;

    @Column({ type: 'uuid' })
    creator_id: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'creator_id' })
    creator: UserEntity;

    @Column({ type: 'varchar', length: 500 })
    title: string;

    @Column({ type: 'text', nullable: true })
    description: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    category: string;

    // Pool state
    @Column({
        type: 'enum',
        enum: ['OPEN', 'CLOSED', 'SETTLED', 'CANCELLED'],
        default: 'OPEN',
    })
    status: string;

    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.0 })
    yes_pool: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.0 })
    no_pool: number;

    // Resolution
    @Column({ type: 'enum', enum: ['YES', 'NO'], nullable: true })
    winning_outcome: string;

    @Column({ type: 'uuid', nullable: true })
    referee_id: string;

    @ManyToOne(() => UserEntity, { nullable: true })
    @JoinColumn({ name: 'referee_id' })
    referee: UserEntity;

    // Timing
    @Column({ type: 'timestamptz' })
    expiry_timestamp: Date;

    @Column({ type: 'timestamptz', nullable: true })
    settled_at: Date;

    // Fees
    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.0 })
    listing_fee_paid: number;

    @Column({ type: 'decimal', precision: 5, scale: 4, default: 0.05 })
    platform_fee_rate: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    // Multi-campus scope (added in migration 006)
    @Column({
        type: 'enum',
        enum: ['LOCAL', 'REGIONAL', 'NATIONAL'],
        default: 'LOCAL',
    })
    scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL';

    @Column({ type: 'uuid', nullable: true })
    institution_id: string;

    @Column({ type: 'boolean', default: false })
    featured: boolean;

    // RLMT Domain Partition
    @Column({ type: 'varchar', length: 100, default: 'iift.edu' })
    college_domain: string;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
