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
    register(email: string, username: string, password: string, displayName?: string, campusName?: string, institutionId?: string): Promise<{
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
    login(email: string, password: string): Promise<{
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
    acceptTos(userId: string): Promise<{
        success: boolean;
    }>;
    googleLogin(idToken: string): Promise<{
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
    private generateToken;
}
