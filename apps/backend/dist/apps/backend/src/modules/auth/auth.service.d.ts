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
    getCampuses(domain: string): Promise<{
        campuses: any;
    }>;
    register(email: string, username: string, password: string, displayName?: string, campusName?: string, institutionId?: string): Promise<{
        user: {
            user_id: string;
            username: string;
        };
        token: string;
    }>;
    login(email: string, password: string): Promise<{
        user: {
            user_id: string;
            username: string;
            tos_accepted: boolean;
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
            tos_accepted: boolean;
            credibility_score: number;
            isNewUser: boolean;
        };
        token: string;
    }>;
    private generateToken;
}
