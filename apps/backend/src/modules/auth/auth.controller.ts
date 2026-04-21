import { Controller, Post, Body, Get, Query, UseGuards, Request } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { RegisterDto, LoginDto } from './dto/auth.dto';
import { GoogleAuthDto } from './dto/google-auth.dto';
import { Public } from '../../common/decorators/public.decorator';

@Controller('auth')
export class AuthController {
    constructor(private readonly authService: AuthService) { }

    @Public()
    @Get('campuses')
    async getCampuses(@Query('domain') domain: string) {
        return this.authService.getCampuses(domain);
    }

    @Public()
    @Post('register')
    async register(@Body() body: RegisterDto) {
        return this.authService.register(body.email, body.username, body.password, body.displayName, body.campus, body.institution_id);
    }

    @Public()
    @Post('login')
    async login(@Body() body: LoginDto) {
        return this.authService.login(body.email, body.password);
    }

    @Public()
    @Post('google')
    async googleLogin(@Body() body: GoogleAuthDto) {
        return this.authService.googleLogin(body.idToken);
    }

    @UseGuards(JwtAuthGuard)
    @Post('accept-tos')
    async acceptTos(@Request() req: any) {
        return this.authService.acceptTos(req.user.userId);
    }
}
