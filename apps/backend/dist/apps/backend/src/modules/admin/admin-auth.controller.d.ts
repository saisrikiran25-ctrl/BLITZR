import { AdminAuthService } from './admin-auth.service';
export declare class AdminAuthController {
    private readonly adminAuthService;
    constructor(adminAuthService: AdminAuthService);
    login(body: {
        email: string;
        password: string;
    }): Promise<{
        token: string;
        user: {
            user_id: string;
            email: string;
            role: "USER" | "ADMIN" | "INSTITUTION_ADMIN";
            institution_id: string;
        };
    }>;
}
