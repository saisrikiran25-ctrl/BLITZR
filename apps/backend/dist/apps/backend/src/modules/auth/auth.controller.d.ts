import { AuthService } from './auth.service';
import { GoogleAuthDto } from './dto/google-auth.dto';
export declare class AuthController {
    private readonly authService;
    constructor(authService: AuthService);
    getCampuses(domain: string): Promise<{
        campuses: any;
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
