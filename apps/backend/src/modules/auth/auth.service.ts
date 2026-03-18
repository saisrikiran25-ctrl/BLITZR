import { Injectable, UnauthorizedException, ConflictException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly dataSource: DataSource,
    ) { }

    async register(email: string, username: string, password: string, displayName?: string) {
        // 1. Extract domain from email
        const baseDomain = email.split('@')[1];

        // 2. Check if domain exists in institutions table
        const res = await this.dataSource.query(
            'SELECT * FROM institutions WHERE email_domain = $1 AND verified = true',
            [baseDomain]
        );
        const institution = res[0];

        // 3. If no institution found, add to waitlist and reject
        if (!institution) {
            await this.dataSource.query(
                'INSERT INTO waitlist (email, email_domain) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                [email, baseDomain]
            );
            throw new BadRequestException(
                'Your college is not yet on BLITZR. You have been added to the waitlist.'
            );
        }

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

        // 4. Create user with institution_id linked
        const user = await this.usersService.create({
            email,
            username,
            display_name: displayName || username,
            password_hash: passwordHash,
            institution_id: institution.institution_id,
            credibility_score: 50, // base score for verified college email
            tos_accepted: false,
        });

        // Generate token including institution code for easy access
        const token = this.generateToken(user.user_id, institution.short_code);
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

        // Fetch institution code
        let shortCode = 'UNKNOWN';
        if (user.institution_id) {
            const res = await this.dataSource.query(
                'SELECT short_code FROM institutions WHERE institution_id = $1',
                [user.institution_id]
            );
            if (res.length > 0) {
                shortCode = res[0].short_code;
            }
        }

        const token = this.generateToken(user.user_id, shortCode);
        return {
            user: {
                user_id: user.user_id,
                username: user.username,
                tos_accepted: user.tos_accepted,
                credibility_score: user.credibility_score,
            },
            token,
        };
    }

    async acceptTos(userId: string) {
        await this.dataSource.query(
            'UPDATE users SET tos_accepted = true, tos_accepted_at = NOW() WHERE user_id = $1',
            [userId]
        );
        return { success: true };
    }

    private generateToken(userId: string, collegeDomain: string): string {
        return this.jwtService.sign({ sub: userId, collegeDomain });
    }
}
