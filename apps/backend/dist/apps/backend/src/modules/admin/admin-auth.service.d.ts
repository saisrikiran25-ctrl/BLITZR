import { JwtService } from '@nestjs/jwt';
import { UsersService } from '../users/users.service';
export declare class AdminAuthService {
    private readonly usersService;
    private readonly jwtService;
    constructor(usersService: UsersService, jwtService: JwtService);
    login(email: string, password: string): Promise<{
        token: string;
        user: {
            user_id: string;
            email: string;
            role: "USER" | "ADMIN" | "INSTITUTION_ADMIN";
            institution_id: string;
        };
    }>;
}
