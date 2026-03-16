import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { WalletService } from './wallet.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('wallet')
export class WalletController {
    constructor(private readonly walletService: WalletService) { }

    @UseGuards(JwtAuthGuard)
    @Post('exchange/creds-to-chips')
    async credsToChips(@Request() req: any, @Body() body: { amount: number }) {
        return this.walletService.credsToChips(req.user.userId, body.amount);
    }

    @UseGuards(JwtAuthGuard)
    @Post('exchange/chips-to-creds')
    async chipsToCreds(@Request() req: any, @Body() body: { amount: number }) {
        return this.walletService.chipsToCreds(req.user.userId, body.amount);
    }
}
