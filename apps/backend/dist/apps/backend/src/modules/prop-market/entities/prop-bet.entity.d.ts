import { UserEntity } from '../../users/entities/user.entity';
import { PropEventEntity } from './prop-event.entity';
export declare class PropBetEntity {
    bet_id: string;
    event_id: string;
    event: PropEventEntity;
    user_id: string;
    user: UserEntity;
    outcome_choice: string;
    chip_amount: number;
    payout_amount: number;
    is_settled: boolean;
    created_at: Date;
}
