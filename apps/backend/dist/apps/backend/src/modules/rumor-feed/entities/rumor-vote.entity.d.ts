import { UserEntity } from '../../users/entities/user.entity';
import { RumorEntity } from './rumor.entity';
export declare enum VoteType {
    UP = "UP",
    DOWN = "DOWN"
}
export declare class RumorVoteEntity {
    vote_id: string;
    user_id: string;
    post_id: string;
    vote_type: VoteType;
    created_at: Date;
    updated_at: Date;
    user: UserEntity;
    rumor: RumorEntity;
}
