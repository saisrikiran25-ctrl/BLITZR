import { UserEntity } from '../../users/entities/user.entity';
import { TickerEntity } from '../../ipo/entities/ticker.entity';
export declare class TransactionEntity {
    tx_id: string;
    user_id: string;
    user: UserEntity;
    ticker_id: string;
    ticker: TickerEntity;
    prop_event_id: string;
    tx_type: string;
    shares_quantity: number;
    amount: number;
    price_at_execution: number;
    supply_at_execution: number;
    burn_amount: number;
    dividend_amount: number;
    platform_fee_amount: number;
    currency: string;
    created_at: Date;
}
