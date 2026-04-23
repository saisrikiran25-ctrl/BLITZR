import { AuthService } from './auth.service';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getCampuses(domain: string): Promise<{
        campuses: any;
    }>;
    register(body: RegisterDto): Promise<{
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
    }>;
    login(body: LoginDto): Promise<{
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
    }>;
    googleLogin(body: GoogleAuthDto): Promise<{
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
    }>;
    acceptTos(req: any): Promise<{
        success: boolean;
    }>;
}
