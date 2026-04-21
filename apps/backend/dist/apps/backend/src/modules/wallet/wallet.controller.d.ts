import { WalletService } from './wallet.service';
export declare class WalletController {
    private readonly walletService;
    constructor(walletService: WalletService);
    credsToChips(req: any, body: {
        amount: number;
    }): Promise<{
        message: string;
        balances: {
            cred_balance: string;
            chip_balance: string;
        };
    }>;
    chipsToCreds(req: any, body: {
        amount: number;
    }): Promise<{
        message: string;
        balances: {
            cred_balance: string;
            chip_balance: string;
        };
    }>;
}
