import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';
export declare class AuthService {
    private readonly usersService;
    private readonly jwtService;
    private readonly configService;
    private readonly dataSource;
    private googleClient;
    constructor(usersService: UsersService, jwtService: JwtService, configService: ConfigService, dataSource: DataSource);
    private getGoogleClientAudiences;
    private isGoogleTokenVerificationError;
    getCampuses(domain: string): Promise<{
        campuses: any;
    }>;
    acceptTos(userId: string): Promise<{
        success: boolean;
    }>;
    googleLogin(idToken: string): Promise<{
        status: string;
        user: {
            user_id: string;
            username: string;
            email: string;
            tos_accepted: boolean;
            is_ipo_active: boolean;
            rumor_disclosure_accepted: any;
            credibility_score: number;
        };
        token: string;
        isNewUser: boolean;
        daily_reward_granted: boolean;
        chips_awarded: number;
        campuses?: undefined;
        tempToken?: undefined;
    } | {
        status: string;
        campuses: any;
        tempToken: string;
        user?: undefined;
        token?: undefined;
        isNewUser?: undefined;
        daily_reward_granted?: undefined;
        chips_awarded?: undefined;
    } | {
        status: string;
        user: {
            user_id: string;
            username: string;
            email: string;
            tos_accepted: boolean;
            is_ipo_active: boolean;
            rumor_disclosure_accepted: any;
            credibility_score: number;
        };
        token: string;
        isNewUser: boolean;
        daily_reward_granted?: undefined;
        chips_awarded?: undefined;
        campuses?: undefined;
        tempToken?: undefined;
    }>;
    /**
     * Step 2 of Google Login: Finalize with campus selection
     */
    selectCampus(idToken: string, institutionId: string): Promise<{
        status: string;
        user: {
            user_id: string;
            username: string;
            email: string;
            tos_accepted: boolean;
            is_ipo_active: boolean;
        };
        token: string;
        isNewUser: boolean;
    }>;
    private createGoogleUser;
    private generateToken;
    /**
     * Daily Login Reward
     * Credits 100 chips to an existing user once per calendar day (UTC).
     * Uses an atomic UPDATE with a WHERE guard so concurrent logins cannot
     * double-credit the same account.
     *
     * Returns { granted: true, amount: 100 } if the reward was applied,
     * or { granted: false, amount: 0 } if the user already claimed today.
     */
    private grantDailyLoginReward;
}
