import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
declare const AdminJwtStrategy_base: new (...args: any[]) => Strategy;
export declare class AdminJwtStrategy extends AdminJwtStrategy_base {
    private readonly dataSource;
    constructor(configService: ConfigService, dataSource: DataSource);
    validate(payload: {
        sub: string;
        institution_id?: string;
        role?: string;
    }): Promise<{
        adminId: string;
        institutionId: string | null;
        role: string;
    }>;
}
export {};
