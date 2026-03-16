import { Controller, Post, Body, Get, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { CAMPUS_DICTIONARY } from './campus.dictionary';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('campuses')
    getCampuses(@Query('domain') domain: string) {
        if (!domain) {
            return { campuses: [] };
        }

        // Return valid campuses for this domain, or empty array if single-campus
        const campuses = CAMPUS_DICTIONARY[domain.toLowerCase()] || [];
        return { campuses };
    }

    @Post('register')
    async register(
        @Body() body: { email: string; username: string; password: string; displayName?: string; campus?: string },
    ) {
        return this.authService.register(body.email, body.username, body.password, body.displayName, body.campus);
    }

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }
}
