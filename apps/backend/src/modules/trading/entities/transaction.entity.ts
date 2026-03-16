import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { TickerEntity } from '../../ipo/entities/ticker.entity';

@Entity('transactions')
export class TransactionEntity {
    @PrimaryGeneratedColumn('uuid')
    tx_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    // Polymorphic asset reference
    @Column({ type: 'varchar', length: 50, nullable: true })
    ticker_id: string;

    @ManyToOne(() => TickerEntity, { nullable: true })
    @JoinColumn({ name: 'ticker_id' })
    ticker: TickerEntity;

    @Column({ type: 'uuid', nullable: true })
    prop_event_id: string;

    // Trade details
    @Column({
        type: 'enum',
        enum: ['BUY', 'SELL', 'BET', 'DIVIDEND', 'BURN', 'EXCHANGE', 'TRANSFER', 'FEE'],
    })
    tx_type: string;

    @Column({ type: 'bigint', nullable: true })
    shares_quantity: number;

    @Column({ type: 'decimal', precision: 18, scale: 4 })
    amount: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, nullable: true })
    price_at_execution: number;

    @Column({ type: 'bigint', nullable: true })
    supply_at_execution: number;

    // Fee breakdown
    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.0 })
    burn_amount: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.0 })
    dividend_amount: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.0 })
    platform_fee_amount: number;

    @Column({ type: 'varchar', length: 10, default: 'CRED' })
    currency: string;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
