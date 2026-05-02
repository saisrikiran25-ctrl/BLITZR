"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const bcrypt = __importStar(require("bcrypt"));
const google_auth_library_1 = require("google-auth-library");
const users_service_1 = require("../users/users.service");
const typeorm_1 = require("typeorm");
/** Max iterations before bailing out of the username collision loop. */
const MAX_USERNAME_ATTEMPTS = 100;
let AuthService = class AuthService {
    constructor(usersService, jwtService, configService, dataSource) {
        this.usersService = usersService;
        this.jwtService = jwtService;
        this.configService = configService;
        this.dataSource = dataSource;
        const audiences = this.getGoogleClientAudiences();
        this.googleClient = new google_auth_library_1.OAuth2Client(audiences[0]);
    }
    getGoogleClientAudiences() {
        const googleClientIdsCsv = this.configService.get('GOOGLE_CLIENT_IDS');
        const configuredAudiences = [
            this.configService.get('GOOGLE_WEB_CLIENT_ID'),
            this.configService.get('GOOGLE_ANDROID_CLIENT_ID'),
            this.configService.get('GOOGLE_IOS_CLIENT_ID'),
            this.configService.get('GOOGLE_CLIENT_ID'), // Legacy fallback
            ...(googleClientIdsCsv
                ? googleClientIdsCsv.split(',').map((value) => value.trim())
                : []),
        ]
            .map((value) => value?.trim())
            .filter((value) => Boolean(value));
        return Array.from(new Set(configuredAudiences));
    }
    isGoogleTokenVerificationError(message) {
        const normalized = message.toLowerCase();
        return (normalized.includes('wrong recipient') ||
            normalized.includes('invalid token') ||
            normalized.includes('token used too early') ||
            normalized.includes('token used too late') ||
            normalized.includes('jwt malformed') ||
            normalized.includes('audience'));
    }
    async getCampuses(domain) {
        console.log(`[DEBUG] getCampuses called for domain: "${domain}"`);
        const res = await this.dataSource.query('SELECT name FROM institutions WHERE email_domain = $1 AND verified = true', [domain]);
        console.log(`[DEBUG] Found ${res.length} campuses for domain: "${domain}"`, res);
        return { campuses: res.map((r) => r.name) };
    }
    async acceptTos(userId) {
        await this.dataSource.query('UPDATE users SET tos_accepted = true, tos_accepted_at = NOW() WHERE user_id = $1', [userId]);
        return { success: true };
    }
    async googleLogin(idToken) {
        try {
            const audiences = this.getGoogleClientAudiences();
            if (audiences.length === 0) {
                throw new common_1.InternalServerErrorException('Google authentication is not configured on the server.');
            }
            const ticket = await this.googleClient.verifyIdToken({
                idToken,
                audience: audiences,
            });
            const payload = ticket.getPayload();
            if (!payload || !payload.email) {
                throw new common_1.UnauthorizedException('Invalid Google token payload');
            }
            const { email, name, hd } = payload; // hd is the hosted domain (institution)
            const domain = hd || email.split('@')[1];
            // 1. Find all institutions for this domain
            const institutions = await this.dataSource.query('SELECT institution_id, name, short_code, email_domain FROM institutions WHERE email_domain = $1 AND verified = true', [domain]);
            if (institutions.length === 0) {
                // Add to waitlist just like manual registration
                await this.dataSource.query('INSERT INTO waitlist (email, email_domain) VALUES ($1, $2) ON CONFLICT DO NOTHING', [email, domain]);
                throw new common_1.BadRequestException('Your college is not yet on BLITZR. You have been added to the waitlist.');
            }
            // 2. Find or Create User
            let user = await this.usersService.findByEmail(email);
            // If user exists, we already know their campus
            if (user) {
                const userInst = institutions.find((i) => i.institution_id === user.institution_id);
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
                    campuses: institutions.map((i) => ({
                        id: i.institution_id,
                        name: i.name,
                        short_code: i.short_code
                    })),
                    tempToken: idToken // Frontend sends this back to selectCampus
                };
            }
            // 4. Single Campus Flow - AUTO-SELECT
            const institution = institutions[0];
            user = await this.createGoogleUser(email, name || '', institution.institution_id);
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
        }
        catch (error) {
            console.error('Google Login Error:', error);
            throw new common_1.UnauthorizedException('Authentication failed');
        }
    }
    /**
     * Step 2 of Google Login: Finalize with campus selection
     */
    async selectCampus(idToken, institutionId) {
        const ticket = await this.googleClient.verifyIdToken({
            idToken,
            audience: this.getGoogleClientAudiences(),
        });
        const payload = ticket.getPayload();
        if (!payload || !payload.email)
            throw new common_1.UnauthorizedException('Invalid Token');
        const { email, name } = payload;
        // Ensure institution is valid for this domain
        const domain = email.split('@')[1];
        const instRes = await this.dataSource.query('SELECT short_code FROM institutions WHERE institution_id = $1 AND email_domain = $2', [institutionId, domain]);
        if (!instRes.length)
            throw new common_1.BadRequestException('Invalid campus selection for your email domain');
        const user = await this.createGoogleUser(email, name || '', institutionId);
        const token = this.generateToken(user.user_id, instRes[0].short_code);
        return {
            status: 'SUCCESS',
            user: {
                user_id: user.user_id,
                username: user.username,
                email: user.email,
                tos_accepted: user.tos_accepted,
                is_ipo_active: user.is_ipo_active,
            },
            token,
            isNewUser: true
        };
    }
    async createGoogleUser(email, name, institutionId) {
        // Generate random placeholder password for OAuth accounts
        const tempPassword = Math.random().toString(36).slice(-16);
        const salt = await bcrypt.genSalt(12);
        const passwordHash = await bcrypt.hash(tempPassword, salt);
        const baseUsername = email.split('@')[0].replace(/[^a-zA-Z0-9]/g, '').toLowerCase();
        let username = baseUsername;
        let counter = 1;
        // FIX-A: Cap the loop at MAX_USERNAME_ATTEMPTS (100) to prevent an infinite
        // loop under extreme username collision conditions. Beyond the cap we fall
        // back to a UUID-suffixed username which is guaranteed to be unique.
        while (counter <= MAX_USERNAME_ATTEMPTS && await this.usersService.isUsernameTaken(username, institutionId)) {
            username = `${baseUsername}${counter++}`;
        }
        if (counter > MAX_USERNAME_ATTEMPTS) {
            // Guaranteed-unique fallback: baseUsername + first 8 chars of a UUID
            const { v4: uuidv4 } = await Promise.resolve().then(() => __importStar(require('uuid')));
            username = `${baseUsername}_${uuidv4().split('-')[0]}`;
        }
        return this.usersService.create({
            email,
            username,
            display_name: name || username,
            password_hash: passwordHash,
            institution_id: institutionId,
            credibility_score: 60,
            tos_accepted: false,
        });
    }
    generateToken(userId, collegeDomain) {
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
    async grantDailyLoginReward(userId) {
        const DAILY_CHIPS = 100;
        try {
            // Atomic single-statement update:
            //   Only updates rows where last_daily_reward_at is NULL
            //   OR its UTC date is before today's UTC date.
            // The RETURNING clause tells us whether a row was actually updated.
            const result = await this.dataSource.query(`UPDATE users
                 SET chip_balance       = chip_balance + $1,
                     last_daily_reward_at = NOW(),
                     updated_at          = NOW()
                 WHERE user_id = $2
                   AND (
                       last_daily_reward_at IS NULL
                       OR DATE(last_daily_reward_at AT TIME ZONE 'UTC') < DATE(NOW() AT TIME ZONE 'UTC')
                   )
                 RETURNING user_id`, [DAILY_CHIPS, userId]);
            if (result.length > 0) {
                console.log(`[DailyReward] Granted ${DAILY_CHIPS} chips to user ${userId}`);
                return { granted: true, amount: DAILY_CHIPS };
            }
            // Already claimed today — no update happened
            return { granted: false, amount: 0 };
        }
        catch (err) {
            // Never let a reward failure break the login flow
            console.error(`[DailyReward] Failed for user ${userId}:`, err);
            return { granted: false, amount: 0 };
        }
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        jwt_1.JwtService,
        config_1.ConfigService,
        typeorm_1.DataSource])
], AuthService);
