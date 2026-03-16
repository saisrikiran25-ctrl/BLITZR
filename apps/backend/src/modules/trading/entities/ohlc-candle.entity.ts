import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { TickerEntity } from '../../ipo/entities/ticker.entity';

/**
 * OHLC Candles Entity
 * Pre-aggregated chart data for line/candle rendering.
 * Intervals: 1m, 5m, 1h, 1d
 * 
 * Per PRD §6.2
 */
@Entity('ohlc_candles')
export class OhlcCandleEntity {
    @PrimaryGeneratedColumn('uuid')
    candle_id: string;

    @Column({ type: 'varchar', length: 50 })
    ticker_id: string;

    @ManyToOne(() => TickerEntity)
    @JoinColumn({ name: 'ticker_id' })
    ticker: TickerEntity;

    @Column({
        type: 'enum',
        enum: ['1m', '5m', '1h', '1d'],
    })
    interval: string;

    @Column({ type: 'decimal', precision: 18, scale: 4 })
    open_price: number;

    @Column({ type: 'decimal', precision: 18, scale: 4 })
    high_price: number;

    @Column({ type: 'decimal', precision: 18, scale: 4 })
    low_price: number;

    @Column({ type: 'decimal', precision: 18, scale: 4 })
    close_price: number;

    @Column({ type: 'bigint', default: 0 })
    volume: number;

    @Column({ type: 'integer', default: 0 })
    trade_count: number;

    @Column({ type: 'timestamptz' })
    bucket_start: Date;

    @CreateDateColumn({ type: 'timestamptz' })
    created_at: Date;
}
