import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';

@Injectable()
export class AdminAuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        if (!['ADMIN', 'INSTITUTION_ADMIN'].includes(user.role)) {
            throw new UnauthorizedException('Admin access denied');
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.jwtService.sign({
            sub: user.user_id,
            institution_id: user.institution_id,
            role: user.role,
        });

        return {
            token,
            user: {
                user_id: user.user_id,
                email: user.email,
                role: user.role,
                institution_id: user.institution_id,
            },
        };
    }
}
