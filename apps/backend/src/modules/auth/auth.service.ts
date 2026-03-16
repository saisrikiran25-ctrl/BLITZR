import { Injectable, UnauthorizedException, ConflictException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { resolveCampusDomain } from './campus.dictionary';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
    ) { }

    async register(email: string, username: string, password: string, displayName?: string, requestedCampus?: string) {
        // Extract domain and resolve strict campus subset
        const baseDomain = email.split('@')[1];
        const collegeDomain = resolveCampusDomain(baseDomain, requestedCampus);

        const existingEmail = await this.usersService.findByEmail(email);
        if (existingEmail) {
            throw new ConflictException('Email already registered');
        }

        const existingUsername = await this.usersService.findByUsername(username);
        if (existingUsername) {
            throw new ConflictException('Username already taken');
        }

        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(password, salt);

        const user = await this.usersService.create({
            email,
            username,
            display_name: displayName || username,
            password_hash: passwordHash,
            college_domain: collegeDomain,
        });

        const token = this.generateToken(user.user_id, user.college_domain);
        return { user: { user_id: user.user_id, username: user.username }, token };
    }

    async login(email: string, password: string) {
        const user = await this.usersService.findByEmail(email);
        if (!user) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const isValid = await bcrypt.compare(password, user.password_hash);
        if (!isValid) {
            throw new UnauthorizedException('Invalid credentials');
        }

        const token = this.generateToken(user.user_id, user.college_domain);
        return { user: { user_id: user.user_id, username: user.username }, token };
    }

    private generateToken(userId: string, collegeDomain: string): string {
        return this.jwtService.sign({ sub: userId, collegeDomain });
    }
}
