import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
    Index,
} from 'typeorm';

@Entity('users')
@Index(['institution_id', 'username'], { unique: true })
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    user_id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 50 })
    username: string;

    @Column({ type: 'varchar', length: 100, nullable: true })
    display_name: string;

    @Column({ type: 'text' })
    password_hash: string;

    // Dual-currency wallet (4 decimal precision)
    @Column({ type: 'decimal', precision: 18, scale: 4, default: 100.0 })
    cred_balance: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, default: 200.0 })
    chip_balance: number;

    // IPO status
    @Column({ type: 'boolean', default: false })
    is_ipo_active: boolean;

    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.0 })
    dividend_earned: number;

    // Metadata
    @Column({ type: 'varchar', length: 100, nullable: true })
    college_domain: string;

    @Column({ type: 'uuid', nullable: true })
    institution_id: string;

    @Column({ type: 'varchar', length: 30, default: 'USER' })
    role: 'USER' | 'ADMIN' | 'INSTITUTION_ADMIN';

    @Column({ type: 'int', default: 50 })
    credibility_score: number;

    @Column({ type: 'boolean', default: false })
    tos_accepted: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    tos_accepted_at: Date;

    @Column({ type: 'boolean', default: false })
    rumor_disclosure_accepted: boolean;

    @Column({ type: 'timestamptz', nullable: true })
    rumor_disclosure_accepted_at: Date;

    @Column({ type: 'boolean', default: false })
    email_verified: boolean;

    @Column({ type: 'text', nullable: true })
    avatar_url: string;

    @Column({ type: 'timestamptz', nullable: true })
    last_active_at: Date;

    @Column({ type: 'timestamptz', nullable: true })
    last_daily_reward_at: Date;

    // Notification Preferences
    @Column({ type: 'boolean', default: true })
    notify_trading: boolean;

    @Column({ type: 'boolean', default: true })
    notify_price_threshold: boolean;

    @Column({ type: 'boolean', default: true })
    notify_arena_resolution: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
