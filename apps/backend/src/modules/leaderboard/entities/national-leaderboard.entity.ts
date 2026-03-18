import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
} from 'typeorm';

@Entity('national_leaderboard')
export class NationalLeaderboardEntity {
    @PrimaryGeneratedColumn('uuid')
    entry_id: string;

    @Column({ type: 'varchar', length: 50, nullable: true })
    ticker_id: string;

    @Column({ type: 'uuid', nullable: true })
    institution_id: string;

    @Column({ type: 'integer', nullable: true })
    campus_rank: number;

    @Column({ type: 'integer', nullable: true })
    national_rank: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
    snapshot_price: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
    snapshot_volume: number;

    @Column({ type: 'boolean', default: false })
    featured: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    computed_at: Date;
}
