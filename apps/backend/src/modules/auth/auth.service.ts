import { Injectable, UnauthorizedException, ConflictException, BadRequestException, InternalServerErrorException, HttpException, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import * as bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { UsersService } from '../users/users.service';
import { DataSource } from 'typeorm';
import { v4 as uuidv4 } from 'uuid';

/** Max iterations before bailing out of the username collision loop. */
const MAX_USERNAME_ATTEMPTS = 100;

@Injectable()
export class AuthService {
    private readonly logger = new Logger(AuthService.name);
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

            const { email, name, hd } = payload;
            const domain = hd || email.split('@')[1];

            // 1. Check for Existing User
            let user = await this.usersService.findByEmail(email);

            // 2. Find all institutions for this domain
            const institutions = await this.dataSource.query(
                'SELECT institution_id, name, short_code, email_domain FROM institutions WHERE email_domain = $1 AND verified = true',
                [domain]
            );

            // 3. Flow A: Existing User
            if (user) {
                this.logger.log(`Existing user sign-in: ${email}`);
                
                // Find their associated institution
                let institution = institutions.find((i: any) => i.institution_id === user!.institution_id);
                
                // Legacy Fix: If user has no institution_id, try to find a match or prompt
                if (!institution) {
                    if (institutions.length === 0) {
                        this.logger.warn(`Existing user ${email} has no valid institution found for domain ${domain}`);
                    } else if (institutions.length === 1) {
                        // Auto-assign the only one
                        institution = institutions[0];
                        await this.usersService.update(user.user_id, { institution_id: institution.institution_id, college_domain: institution.short_code });
                    } else {
                        // Multiple campuses, and they have none — we MUST prompt them even if they exist
                        // but for now, we'll return a special status or just pick the first one if it's a legacy account
                        // The user request says "sign them in as is", so we assume they HAVE a saved institution.
                        this.logger.warn(`Existing user ${email} lacks institution_id but domain has multiple campuses.`);
                    }
                }

                const shortCode = institution ? institution.short_code : (institutions.length > 0 ? institutions[0].short_code : 'GLOBAL');
                const token = this.generateToken(user.user_id, shortCode);

                const dailyReward = await this.grantDailyLoginReward(user.user_id);

                const response = {
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
                this.logger.log(`Existing user sign-in success: ${email}. Response structure: ${Object.keys(response).join(', ')}`);
                return response;
            }

            // 4. Flow B: New User
            this.logger.log(`New user sign-up attempt: ${email} (domain: ${domain})`);

            if (institutions.length === 0) {
                this.logger.warn(`Domain ${domain} not found in institutions. Waitlisting ${email}`);
                await this.dataSource.query(
                    'INSERT INTO waitlist (email, email_domain) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [email, domain]
                );
                throw new BadRequestException(
                    'Your college is not yet on BLITZR. You have been added to the waitlist.'
                );
            }

            if (institutions.length > 1) {
                this.logger.log(`Domain ${domain} has multiple campuses. Requesting selection.`);
                return {
                    status: 'REQUIRES_CAMPUS_SELECTION',
                    campuses: institutions.map((i: any) => ({
                        id: i.institution_id,
                        name: i.name,
                        short_code: i.short_code
                    })),
                    tempToken: idToken
                };
            }

            // Single campus auto-select
            const institution = institutions[0];
            this.logger.log(`Auto-selecting campus ${institution.short_code} for new user ${email}`);
            
            user = await this.createGoogleUser(email, name || '', institution.institution_id, institution.short_code);
            
            if (!user || !user.user_id) {
                throw new InternalServerErrorException('Account creation failed.');
            }

            const token = this.generateToken(user.user_id, institution.short_code);
            const dailyReward = await this.grantDailyLoginReward(user.user_id);

            const response = {
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
                daily_reward_granted: dailyReward.granted,
                chips_awarded: dailyReward.granted ? dailyReward.amount : 0,
            };
            this.logger.log(`Google Registration Success for ${email}. Response structure: ${Object.keys(response).join(', ')}`);
            return response;

        } catch (error: any) {
            this.logger.error(`Google Login Error: ${error.message}`, error.stack);
            if (error instanceof HttpException) throw error;
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

        const user = await this.createGoogleUser(email, name || '', institutionId, instRes[0].short_code);
        
        if (!user || !user.user_id) {
            throw new InternalServerErrorException('Account creation failed.');
        }

        const token = this.generateToken(user.user_id, instRes[0].short_code);
        const dailyReward = await this.grantDailyLoginReward(user.user_id);

        const response = {
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
            daily_reward_granted: dailyReward.granted,
            chips_awarded: dailyReward.granted ? dailyReward.amount : 0,
        };
        this.logger.log(`Campus selection finalized for ${email}. Response structure: ${Object.keys(response).join(', ')}`);
        return response;
    }

    private async createGoogleUser(email: string, name: string, institutionId: string, shortCode: string) {
        const domain = email.split('@')[1];
        
        const tempPassword = Math.random().toString(36).slice(-16);
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(tempPassword, salt);
    
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let username = baseUsername;
        let counter = 1;
    
        while (counter <= MAX_USERNAME_ATTEMPTS && await this.usersService.isUsernameTaken(username, institutionId)) {
            username = `${baseUsername}${counter++}`;
        }
        if (counter > MAX_USERNAME_ATTEMPTS) {
            username = `${baseUsername}_${uuidv4().split('-')[0]}`;
        }
    
        try {
            return await this.usersService.create({
                email,
                username,
                display_name: name || username,
                password_hash: passwordHash,
                institution_id: institutionId,
                college_domain: shortCode, // Sync with segmented floor
                credibility_score: 60,
                tos_accepted: false,
            });
        } catch (err: any) {
            this.logger.error(`CRITICAL: Google User Creation Failed: ${err.message}`);
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
