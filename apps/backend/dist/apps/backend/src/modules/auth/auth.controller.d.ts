import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getCampuses(domain: string): Promise<{
        campuses: any;
    }>;
    googleLogin(body: GoogleAuthDto): Promise<{
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
    selectCampus(body: {
        idToken: string;
        institutionId: string;
    }): Promise<{
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
    acceptTos(req: any): Promise<{
        success: boolean;
    }>;
}
