import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    OneToOne,
    OneToMany,
} from 'typeorm';

@Entity('users')
export class UserEntity {
    @PrimaryGeneratedColumn('uuid')
    user_id: string;

    @Column({ type: 'varchar', length: 255, unique: true })
    email: string;

    @Column({ type: 'varchar', length: 50, unique: true })
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

    @Column({ type: 'boolean', default: false })
    email_verified: boolean;

    @Column({ type: 'text', nullable: true })
    avatar_url: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
