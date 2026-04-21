import { Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
declare const JwtStrategy_base: new (...args: any[]) => Strategy;
export declare class JwtStrategy extends JwtStrategy_base {
    private readonly dataSource;
    constructor(configService: ConfigService, dataSource: DataSource);
    validate(payload: {
        sub: string;
        collegeDomain: string;
    }): Promise<{
        userId: string;
        collegeDomain: string;
    }>;
}
export {};
