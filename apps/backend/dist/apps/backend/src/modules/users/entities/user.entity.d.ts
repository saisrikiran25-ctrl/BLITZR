export declare class UserEntity {
    user_id: string;
    email: string;
    username: string;
    display_name: string;
    password_hash: string;
    cred_balance: number;
    chip_balance: number;
    is_ipo_active: boolean;
    dividend_earned: number;
    college_domain: string;
    institution_id: string;
    role: 'USER' | 'ADMIN' | 'INSTITUTION_ADMIN';
    credibility_score: number;
    tos_accepted: boolean;
    tos_accepted_at: Date;
    rumor_disclosure_accepted: boolean;
    rumor_disclosure_accepted_at: Date;
    email_verified: boolean;
    avatar_url: string;
    last_active_at: Date;
    notify_trading: boolean;
    notify_price_threshold: boolean;
    notify_arena_resolution: boolean;
    created_at: Date;
    updated_at: Date;
}
