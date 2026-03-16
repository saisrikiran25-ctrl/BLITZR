import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
    Unique,
} from 'typeorm';
import { UserEntity } from '../../users/entities/user.entity';
import { TickerEntity } from './ticker.entity';

@Entity('holdings')
@Unique('uq_user_ticker', ['user_id', 'ticker_id'])
export class HoldingEntity {
    @PrimaryGeneratedColumn('uuid')
    holding_id: string;

    @Column({ type: 'uuid' })
    user_id: string;

    @ManyToOne(() => UserEntity)
    @JoinColumn({ name: 'user_id' })
    user: UserEntity;

    @Column({ type: 'varchar', length: 50 })
    ticker_id: string;

    @ManyToOne(() => TickerEntity)
    @JoinColumn({ name: 'ticker_id' })
    ticker: TickerEntity;

    @Column({ type: 'bigint', default: 0 })
    shares_held: number;

    @Column({ type: 'decimal', precision: 18, scale: 4, default: 0.0 })
    avg_buy_price: number;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;

    @UpdateDateColumn({ type: 'timestamptz' })
    updated_at: Date;
}
