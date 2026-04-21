import { DataSource } from 'typeorm';
/**
 * WalletService
 * Handles dual-currency exchange: 1 Cred ↔ 2 Chips
 */
export declare class WalletService {
    private readonly dataSource;
    constructor(dataSource: DataSource);
    /**
     * Exchange Creds to Chips.
     * 1 Cred = 2 Chips
     */
    credsToChips(userId: string, credAmount: number): Promise<{
        message: string;
        balances: {
            cred_balance: string;
            chip_balance: string;
        };
    }>;
    /**
     * Exchange Chips to Creds.
     * 2 Chips = 1 Cred
     */
    chipsToCreds(userId: string, chipAmount: number): Promise<{
        message: string;
        balances: {
            cred_balance: string;
            chip_balance: string;
        };
    }>;
}
