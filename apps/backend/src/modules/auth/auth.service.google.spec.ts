import { Test, TestingModule } from '@nestjs/testing';
import { AuthService } from './auth.service';
import { UsersService } from '../users/users.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { DataSource } from 'typeorm';
import { BadRequestException } from '@nestjs/common';

const mockVerifyIdToken = jest.fn().mockImplementation(({ idToken }) => {
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
});

// Mocking OAuth2Client
jest.mock('google-auth-library', () => {
    return {
        OAuth2Client: jest.fn().mockImplementation(() => {
            return {
                verifyIdToken: mockVerifyIdToken,
            };
        })
    };
});

describe('AuthService (Google Identity Verification)', () => {
    let service: AuthService;
    let dataSource: any;

    beforeEach(async () => {
        mockVerifyIdToken.mockClear();
        dataSource = {
            query: jest.fn().mockImplementation((query, params) => {
                if (query.includes('FROM institutions') && params[0] === 'iift.edu') {
                    return [{ institution_id: 'inst_123', email_domain: 'iift.edu', verified: true, short_code: 'IIFT' }];
                }
                return [];
            })
        };

        const module: TestingModule = await Test.createTestingModule({
            providers: [
                AuthService,
                { provide: UsersService, useValue: { findByEmail: jest.fn().mockResolvedValue(null), create: jest.fn().mockResolvedValue({ user_id: 'u_123', username: 'student' }), isUsernameTaken: jest.fn().mockResolvedValue(false) } },
                { provide: JwtService, useValue: { sign: jest.fn().mockReturnValue('mock_jwt') } },
                {
                    provide: ConfigService,
                    useValue: {
                        get: jest.fn().mockImplementation((key: string) => {
                            const values: Record<string, string> = {
                                GOOGLE_WEB_CLIENT_ID: 'mock_web_client_id',
                                GOOGLE_ANDROID_CLIENT_ID: 'mock_android_client_id',
                                GOOGLE_IOS_CLIENT_ID: 'mock_ios_client_id',
                                GOOGLE_CLIENT_IDS: '',
                            };
                            return values[key];
                        })
                    }
                },
                { provide: DataSource, useValue: dataSource },
            ],
        }).compile();

        service = module.get<AuthService>(AuthService);
    });

    it('should successfully verify and register a valid institutional email', async () => {
        const result = await service.googleLogin('valid_token');
        expect(result.user.username).toBeDefined();
        expect(result.token).toBe('mock_jwt');
        expect(mockVerifyIdToken).toHaveBeenCalledWith({
            idToken: 'valid_token',
            audience: ['mock_web_client_id', 'mock_android_client_id', 'mock_ios_client_id']
        });
    });

    it('should reject a non-institutional domain (gmail.com)', async () => {
        await expect(service.googleLogin('invalid_domain_token')).rejects.toThrow(BadRequestException);
        expect(dataSource.query).toHaveBeenCalledWith(expect.stringContaining('INSERT INTO waitlist'), expect.any(Array));
    });

    it('should throw UnauthorizedException for malformed tokens', async () => {
        await expect(service.googleLogin('bad_token')).rejects.toThrow();
    });
});
