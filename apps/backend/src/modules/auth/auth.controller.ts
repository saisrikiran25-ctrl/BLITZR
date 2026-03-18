import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';

@Controller('v1/auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Get('campuses')
    async getCampuses(@Query('domain') domain: string) {
        // Provide endpoint backwards compatibility if needed, though replaced by DB
        return { campuses: [] }; 
    }

    @Post('register')
    async register(
        @Body() body: { email: string; username: string; password: string; displayName?: string },
    ) {
        return this.authService.register(body.email, body.username, body.password, body.displayName);
    }

    @Post('login')
    async login(@Body() body: { email: string; password: string }) {
        return this.authService.login(body.email, body.password);
    }

    @UseGuards(JwtAuthGuard)
    @Post('accept-tos')
    async acceptTos(@Request() req: any) {
        return this.authService.acceptTos(req.user.userId);
    }
}
