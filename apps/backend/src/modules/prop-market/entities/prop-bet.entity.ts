import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { PropEventEntity } from './prop-event.entity';

@Entity('prop_bets')
export class PropBetEntity {
    @PrimaryGeneratedColumn('uuid')
    bet_id: string;

    @Column({ type: 'uuid' })
    event_id: string;

    @ManyToOne(() => PropEventEntity)
    @JoinColumn({ name: 'event_id' })
    event: PropEventEntity;

    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ type: 'enum', enum: ['YES', 'NO'] })
    outcome_choice: string;

    @Column({ type: 'decimal', precision: 18, scale: 4 })
    chip_amount: number;

    // Payout (calculated on settlement)
    @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
    payout_amount: number;

    @Column({ type: 'boolean', default: false })
    is_settled: boolean;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
