export interface User {
    user_id: string;
    email: string;
    username: string;
    display_name?: string;
    cred_balance: number;
    chip_balance: number;
    is_ipo_active: boolean;
    dividend_earned: number;
    college_domain?: string;
    email_verified: boolean;
    avatar_url?: string;
    created_at: string;
    updated_at: string;
}
export interface UserPublicProfile {
    user_id: string;
    username: string;
    display_name?: string;
    is_ipo_active: boolean;
    avatar_url?: string;
}
