import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';

@Injectable()
export class AdminJwtStrategy extends PassportStrategy(Strategy, 'admin-jwt') {
    constructor(
        configService: ConfigService,
        private readonly dataSource: DataSource,
    ) {
        super({
            jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
            ignoreExpiration: false,
            secretOrKey: configService.get<string>('ADMIN_JWT_SECRET', 'blitzr-admin-secret'),
        });
    }

    async validate(payload: { sub: string; institution_id?: string; role?: string }) {
        await this.dataSource.query(
            `UPDATE users SET last_active_at = NOW() WHERE user_id = $1`,
            [payload.sub],
        );
        return {
            adminId: payload.sub,
            institutionId: payload.institution_id ?? null,
            role: payload.role ?? 'ADMIN',
        };
    }
}
