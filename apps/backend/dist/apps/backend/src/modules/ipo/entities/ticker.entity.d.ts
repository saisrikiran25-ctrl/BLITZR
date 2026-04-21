import { UserEntity } from '../../users/entities/user.entity';
export declare class TickerEntity {
    ticker_id: string;
    owner_id: string;
    owner: UserEntity;
    current_supply: number;
    scaling_constant: number;
    price_open: number;
    total_volume: number;
    total_trades: number;
    human_trades_1h: number;
    status: 'ACTIVE' | 'FROZEN' | 'AUTO_FROZEN' | 'MANUAL_FROZEN' | 'PENDING' | 'DELISTED';
    frozen_until: Date;
    category: string;
    created_at: Date;
    college_domain: string;
    updated_at: Date;
}
