"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const testing_1 = require("@nestjs/testing");
const auth_service_1 = require("./auth.service");
const users_service_1 = require("../users/users.service");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("typeorm");
const common_1 = require("@nestjs/common");
// Mocking OAuth2Client
jest.mock('google-auth-library', () => {
    return {
        OAuth2Client: jest.fn().mockImplementation(() => {
            return {
                verifyIdToken: jest.fn().mockImplementation(({ idToken }) => {
                    if (idToken === 'valid_token') {
                        return {
                            getPayload: () => ({
                                email: 'student@iift.edu',
                                name: 'Test Student',
                                hd: 'iift.edu'
                            })
                        };
                    }
                    if (idToken === 'invalid_domain_token') {
                        return {
                            getPayload: () => ({
                                email: 'hacker@gmail.com',
                                name: 'Bad Actor',
                                hd: 'gmail.com'
                            })
                        };
                    }
                    throw new Error('Invalid token');
                })
            };
        })
    };
});
describe('AuthService (Google Identity Verification)', () => {
    let service;
    let dataSource;
    beforeEach(async () => {
        dataSource = {
            query: jest.fn().mockImplementation((query, params) => {
                if (query.includes('FROM institutions') && params[0] === 'iift.edu') {
                    return [{ institution_id: 'inst_123', email_domain: 'iift.edu', verified: true, short_code: 'IIFT' }];
                }
                return [];
            })
        };
        const module = await testing_1.Test.createTestingModule({
            providers: [
                auth_service_1.AuthService,
                { provide: users_service_1.UsersService, useValue: { findByEmail: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ user_id: 'u_123', username: 'student' }), isUsernameTaken: jest.fn().mockResolvedValue(false) } },
                { provide: jwt_1.JwtService, useValue: { sign: jest.fn().mockReturnValue('mock_jwt') } },
                { provide: config_1.ConfigService, useValue: { get: jest.fn().mockReturnValue('mock_client_id') } },
                { provide: typeorm_1.DataSource, useValue: dataSource },
            ],
        }).compile();
        service = module.get(auth_service_1.AuthService);
    });
    it('should successfully verify and register a valid institutional email', async () => {
        const result = await service.googleLogin('valid_token');
        expect(result.user.username).toBeDefined();
        expect(result.token).toBe('mock_jwt');
    });
    it('should reject a non-institutional domain (gmail.com)', async () => {
        await expect(service.googleLogin('invalid_domain_token')).rejects.toThrow(common_1.BadRequestException);
        expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO waitlist'), expect.any(Array));
    });
    it('should throw UnauthorizedException for malformed tokens', async () => {
        await expect(service.googleLogin('bad_token')).rejects.toThrow();
    });
});
