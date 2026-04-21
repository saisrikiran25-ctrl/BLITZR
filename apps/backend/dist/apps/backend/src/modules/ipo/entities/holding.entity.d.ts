import { UserEntity } from '../../users/entities/user.entity';
import { TickerEntity } from './ticker.entity';
export declare class HoldingEntity {
    holding_id: string;
    user_id: string;
    user: UserEntity;
    ticker_id: string;
    ticker: TickerEntity;
    shares_held: number;
    avg_buy_price: number;
    created_at: Date;
    updated_at: Date;
}
