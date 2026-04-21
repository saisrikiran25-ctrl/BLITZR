import { UserEntity } from '../../users/entities/user.entity';
export declare class PropEventEntity {
    event_id: string;
    creator_id: string;
    creator: UserEntity;
    title: string;
    description: string;
    category: string;
    status: 'OPEN' | 'PAUSED' | 'CLOSED' | 'SETTLED' | 'CANCELLED';
    yes_pool: number;
    no_pool: number;
    options: string[];
    winning_outcome: string;
    referee_id: string;
    referee: UserEntity;
    expiry_timestamp: Date;
    settled_at: Date;
    listing_fee_paid: number;
    platform_fee_rate: number;
    created_at: Date;
    scope: 'LOCAL' | 'REGIONAL' | 'NATIONAL';
    institution_id: string;
    featured: boolean;
    college_domain: string;
    updated_at: Date;
}
