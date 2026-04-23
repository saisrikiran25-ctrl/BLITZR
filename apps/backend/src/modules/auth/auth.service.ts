import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';

@Injectable()
export class AuthService {
    private googleClient: OAuth2Client;

    constructor(
        private readonly usersService: UsersService,
        private readonly jwtService: JwtService,
        private readonly configService: ConfigService,
        private readonly dataSource: DataSource,
    ) {
        const audiences = this.getGoogleClientAudiences();
        this.googleClient = new OAuth2Client(audiences[0]);
    }

    private getGoogleClientAudiences(): string[] {
        const googleClientIdsCsv = this.configService.get<string>('GOOGLE_CLIENT_IDS');
        const configuredAudiences = [
            this.configService.get<string>('GOOGLE_WEB_CLIENT_ID'),
            this.configService.get<string>('GOOGLE_ANDROID_CLIENT_ID'),
            this.configService.get<string>('GOOGLE_IOS_CLIENT_ID'),
            this.configService.get<string>('GOOGLE_CLIENT_ID'), // Legacy fallback
            ...(googleClientIdsCsv
                ? googleClientIdsCsv.split(',').map((value) => value.trim())
                : []),
        ]
            .map((value) => value?.trim())
            .filter((value): value is string => Boolean(value));

        return Array.from(new Set(configuredAudiences));
    }

    private isGoogleTokenVerificationError(message: string): boolean {
        const normalized = message.toLowerCase();
        return (
            normalized.includes('wrong recipient') ||
            normalized.includes('invalid token') ||
            normalized.includes('token used too early') ||
            normalized.includes('token used too late') ||
            normalized.includes('jwt malformed') ||
            normalized.includes('audience')
        );
    }

    async getCampuses(domain: string) {
        console.log(`[DEBUG] getCampuses called for domain: "${domain}"`);
        const res = await this.dataSource.query(
            'SELECT name FROM institutions WHERE email_domain = $1 AND verified = true',
            [domain]
        );
        console.log(`[DEBUG] Found ${res.length} campuses for domain: "${domain}"`, res);
        return { campuses: res.map((r: any) => r.name) };
    }

    async acceptTos(userId: string) {
        await this.dataSource.query(
            'UPDATE users SET tos_accepted = true, tos_accepted_at = NOW() WHERE user_id = $1',
            [userId]
        );
        return { success: true };
    }

    async googleLogin(idToken: string) {
        try {
            const audiences = this.getGoogleClientAudiences();
            if (audiences.length === 0) {
                throw new InternalServerErrorException('Google authentication is not configured on the server.');
            }

            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: audiences,
            });

            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new UnauthorizedException('Invalid Google token payload');
            }

            const { email, name, hd } = payload; // hd is the hosted domain (institution)
            const domain = hd || email.split('@')[1];

            // 1. Validate domain against institutions
            const res = await this.dataSource.query(
                'SELECT * FROM institutions WHERE email_domain = $1 AND verified = true',
                [domain]
            );
            const institution = res[0];

            if (!institution) {
                // Add to waitlist just like manual registration
                await this.dataSource.query(
                    'INSERT INTO waitlist (email, email_domain) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [email, domain]
                );
                throw new BadRequestException(
                    'Your college is not yet on BLITZR. You have been added to the waitlist.'
                );
            }

            // 2. Find or Create User
            let user = await this.usersService.findByEmail(email);
            let isNewUser = false;

            if (!user) {
                isNewUser = true;
                // For Google login, we generate a random temporary password or leave it empty
                // as the user is authenticated via Google.
                const tempPassword = Math.random().toString(36).slice(-16);
                const salt = await bcrypt.genSalt(12);
                const passwordHash = await bcrypt.hash(tempPassword, salt);

                // We don't have a username yet, so we use email prefix as a placeholder
                // The frontend/user will be prompted to change this.
                let baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
                let username = baseUsername;
                let counter = 1;
                
                // Ensure unique username
                while (await this.usersService.isUsernameTaken(username, institution.institution_id)) {
                    username = `${baseUsername}${counter++}`;
                }

                user = await this.usersService.create({
                    email,
                    username,
                    display_name: name || username,
                    password_hash: passwordHash,
                    institution_id: institution.institution_id,
                    credibility_score: 60, // Bonus for verified Google account
                    tos_accepted: false,
                });
            }

            const token = this.generateToken(user.user_id, institution.short_code);

            return {
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    tos_accepted: user.tos_accepted,
                    is_ipo_active: user.is_ipo_active,
                    rumor_disclosure_accepted: (user as any).rumor_disclosure_accepted ?? false,
                    credibility_score: user.credibility_score,
                },
                token,
                isNewUser,
            };
        } catch (error: any) {
            if (error instanceof BadRequestException || error instanceof UnauthorizedException) {
                throw error;
            }

            const message = String(error?.message || '');
            if (this.isGoogleTokenVerificationError(message)) {
                throw new UnauthorizedException('Invalid Google token or audience.');
            }

            console.error('[CRITICAL ERROR] Google Login failed. Details:', {
                error: error.message,
                stack: error.stack,
                googleAudiencesConfigured: this.getGoogleClientAudiences().length
            });
            throw new InternalServerErrorException(`Authentication failed: ${error.message}`);
        }
    }

    private generateToken(userId: string, collegeDomain: string): string {
        return this.jwtService.sign({ sub: userId, collegeDomain });
    }
}
