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
        };
        token: string;
    }>;
    login(body: LoginDto): Promise<{
        user: {
            user_id: string;
            username: string;
            tos_accepted: boolean;
            credibility_score: number;
        };
        token: string;
    }>;
    googleLogin(body: GoogleAuthDto): Promise<{
        user: {
            user_id: string;
            username: string;
            tos_accepted: boolean;
            credibility_score: number;
            isNewUser: boolean;
        };
        token: string;
    }>;
    acceptTos(req: any): Promise<{
        success: boolean;
    }>;
}
