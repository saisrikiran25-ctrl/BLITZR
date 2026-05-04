import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException, HttpException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';

/** Max iterations before bailing out of the username collision loop. */
const MAX_USERNAME_ATTEMPTS = 100;

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

            // 1. Find all institutions for this domain
            const institutions = await this.dataSource.query(
                'SELECT institution_id, name, short_code, email_domain FROM institutions WHERE email_domain = $1 AND verified = true',
                [domain]
            );

            if (institutions.length === 0) {
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

            // If user exists, we already know their campus
            if (user) {
                const userInst = institutions.find((i: any) => i.institution_id === user!.institution_id);
                // JWT uses short_code for campus-based Floor (e.g. 'IIFT-D')
                const token = this.generateToken(user.user_id, userInst ? userInst.short_code : institutions[0].short_code);

                // Grant daily login reward (100 chips) if eligible
                const dailyReward = await this.grantDailyLoginReward(user.user_id);

                return {
                    status: 'SUCCESS',
                    user: {
                        user_id: user.user_id,
                        username: user.username,
                        email: user.email,
                        tos_accepted: user.tos_accepted,
                        is_ipo_active: user.is_ipo_active,
                        rumor_disclosure_accepted: user.rumor_disclosure_accepted ?? false,
                        credibility_score: user.credibility_score,
                    },
                    token,
                    isNewUser: false,
                    daily_reward_granted: dailyReward.granted,
                    chips_awarded: dailyReward.granted ? dailyReward.amount : 0,
                };
            }

            // 3. New User Flow - CHECK FOR MULTIPLE CAMPUSES
            if (institutions.length > 1) {
                return {
                    status: 'REQUIRES_CAMPUS_SELECTION',
                    campuses: institutions.map((i: any) => ({
                        id: i.institution_id,
                        name: i.name,
                        short_code: i.short_code
                    })),
                    tempToken: idToken // Frontend sends this back to selectCampus
                };
            }

            // 4. Single Campus Flow - AUTO-SELECT
            const institution = institutions[0];
            console.log(`[AuthService] New User detected. Auto-selecting campus: ${institution.short_code}`);
            
            user = await this.createGoogleUser(email, name || '', institution.institution_id);
            
            if (!user || !user.user_id) {
                console.error('[AuthService] CRITICAL: User object returned from creation is undefined or missing user_id!');
                throw new InternalServerErrorException('Account creation failed — please try again in a moment.');
            }

            const token = this.generateToken(user.user_id, institution.short_code);

            return {
                status: 'SUCCESS',
                user: {
                    user_id: user.user_id,
                    username: user.username,
                    email: user.email,
                    tos_accepted: user.tos_accepted,
                    is_ipo_active: user.is_ipo_active,
                    rumor_disclosure_accepted: user.rumor_disclosure_accepted ?? false,
                    credibility_score: user.credibility_score,
                },
                token,
                isNewUser: true,
            };

        } catch (error: any) {
            console.error('Google Login Error:', error);
            // Re-throw NestJS HTTP exceptions as-is so the correct status code
            // and message (e.g. BadRequestException "college not on BLITZR",
            // InternalServerErrorException "account creation failed") reach the client.
            if (error instanceof HttpException) {
                throw error;
            }
            if (this.isGoogleTokenVerificationError(error?.message || '')) {
                throw new UnauthorizedException('Invalid or expired Google token. Please sign in again.');
            }
            throw new InternalServerErrorException('Authentication failed due to an unexpected error.');
        }
    }

    /**
     * Step 2 of Google Login: Finalize with campus selection
     */
    async selectCampus(idToken: string, institutionId: string) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: this.getGoogleClientAudiences(),
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email) throw new UnauthorizedException('Invalid Token');

        const { email, name } = payload;

        // Ensure institution is valid for this domain
        const domain = email.split('@')[1];
        const instRes = await this.dataSource.query(
            'SELECT short_code FROM institutions WHERE institution_id = $1 AND email_domain = $2',
            [institutionId, domain]
        );
        if (!instRes.length) throw new BadRequestException('Invalid campus selection for your email domain');

        const user = await this.createGoogleUser(email, name || '', institutionId);
        
        if (!user || !user.user_id) {
            console.error('[AuthService] CRITICAL: User creation failed during campus selection!');
            throw new InternalServerErrorException('Account creation failed.');
        }

        const token = this.generateToken(user.user_id, instRes[0].short_code);

        return {
            status: 'SUCCESS',
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                tos_accepted: user.tos_accepted,
                is_ipo_active: user.is_ipo_active,
                rumor_disclosure_accepted: user.rumor_disclosure_accepted ?? false,
            },
            token,
            isNewUser: true
        };
    }

    private async createGoogleUser(email: string, name: string, institutionId: string) {
        // 1. Get Domain for college_domain sync
        const domain = email.split('@')[1];
        
        // 2. Generate random placeholder password for OAuth accounts
        const tempPassword = Math.random().toString(36).slice(-16);
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(tempPassword, salt);
    
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let username = baseUsername;
        let counter = 1;
    
        // FIX-A: Cap the loop at MAX_USERNAME_ATTEMPTS (100)
        while (counter <= MAX_USERNAME_ATTEMPTS && await this.usersService.isUsernameTaken(username, institutionId)) {
            username = `${baseUsername}${counter++}`;
        }
        if (counter > MAX_USERNAME_ATTEMPTS) {
            const { v4: uuidv4 } = require('uuid');
            username = `${baseUsername}_${uuidv4().split('-')[0]}`;
        }
    
        try {
            return await this.usersService.create({
                email,
                username,
                display_name: name || username,
                password_hash: passwordHash,
                institution_id: institutionId,
                college_domain: domain,
                credibility_score: 60,
                tos_accepted: false,
            });
        } catch (err: any) {
            console.error('[AuthService] CRITICAL: Google User Creation Failed:', err.message);
            throw new InternalServerErrorException(`User registration failed: ${err.message}`);
        }
    }


    private generateToken(userId: string, collegeDomain: string): string {
        return this.jwtService.sign({ sub: userId, collegeDomain });
    }

    /**
     * Daily Login Reward
     * Credits 100 chips to an existing user once per calendar day (UTC).
     * Uses an atomic UPDATE with a WHERE guard so concurrent logins cannot
     * double-credit the same account.
     *
     * Returns { granted: true, amount: 100 } if the reward was applied,
     * or { granted: false, amount: 0 } if the user already claimed today.
     */
    private async grantDailyLoginReward(
        userId: string,
    ): Promise<{ granted: boolean; amount: number }> {
        const DAILY_CHIPS = 100;

        try {
            // Atomic single-statement update:
            //   Only updates rows where last_daily_reward_at is NULL
            //   OR its UTC date is before today's UTC date.
            // The RETURNING clause tells us whether a row was actually updated.
            const result = await this.dataSource.query(
                `UPDATE users
                 SET chip_balance       = chip_balance + $1,
                     last_daily_reward_at = NOW(),
                     updated_at          = NOW()
                 WHERE user_id = $2
                   AND (
                       last_daily_reward_at IS NULL
                       OR DATE(last_daily_reward_at AT TIME ZONE 'UTC') < DATE(NOW() AT TIME ZONE 'UTC')
                   )
                 RETURNING user_id`,
                [DAILY_CHIPS, userId],
            );

            if (result.length > 0) {
                console.log(`[DailyReward] Granted ${DAILY_CHIPS} chips to user ${userId}`);
                return { granted: true, amount: DAILY_CHIPS };
            }

            // Already claimed today — no update happened
            return { granted: false, amount: 0 };
        } catch (err) {
            // Never let a reward failure break the login flow
            console.error(`[DailyReward] Failed for user ${userId}:`, err);
            return { granted: false, amount: 0 };
        }
    }
}
