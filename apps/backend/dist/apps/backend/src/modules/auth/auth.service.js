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
            // 1. Validate domain against institutions
            const res = await this.dataSource.query('SELECT * FROM institutions WHERE email_domain = $1 AND verified = true', [domain]);
            const institution = res[0];
            if (!institution) {
                // Add to waitlist just like manual registration
                await this.dataSource.query('INSERT INTO waitlist (email, email_domain) VALUES ($1, $2) ON CONFLICT DO NOTHING', [email, domain]);
                throw new common_1.BadRequestException('Your college is not yet on BLITZR. You have been added to the waitlist.');
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
                    rumor_disclosure_accepted: user.rumor_disclosure_accepted ?? false,
                    credibility_score: user.credibility_score,
                },
                token,
                isNewUser,
            };
        }
        catch (error) {
            if (error instanceof common_1.BadRequestException || error instanceof common_1.UnauthorizedException) {
                throw error;
            }
            const message = String(error?.message || '');
            if (this.isGoogleTokenVerificationError(message)) {
                throw new common_1.UnauthorizedException('Invalid Google token or audience.');
            }
            console.error('[CRITICAL ERROR] Google Login failed. Details:', {
                error: error.message,
                stack: error.stack,
                googleAudiencesConfigured: this.getGoogleClientAudiences().length
            });
            throw new common_1.InternalServerErrorException(`Authentication failed: ${error.message}`);
        }
    }
    generateToken(userId, collegeDomain) {
        return this.jwtService.sign({ sub: userId, collegeDomain });
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
