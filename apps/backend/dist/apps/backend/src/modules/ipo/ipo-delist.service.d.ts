import { DataSource } from 'typeorm';
import { BondingCurveService } from './bonding-curve.service';
/**
 * IPO Delist Service — The "Panic Button" (PRD §7.1)
 *
 * When a student feels targeted, they can delist their IPO.
 * Sequence:
 * 1. Freeze the ticker (status = 'FROZEN')
 * 2. Iterate all holdings for that ticker
 * 3. Refund each holder: current_price × shares_held
 * 4. Soft-delete the ticker
 */
export declare class IpoDelistService {
    private readonly dataSource;
    private readonly bondingCurve;
    private readonly logger;
    constructor(dataSource: DataSource, bondingCurve: BondingCurveService);
    /**
     * Delist a user's IPO (Panic Button).
     * Must be the ticker owner.
     */
    delistIpo(userId: string): Promise<{
        ticker_id: any;
        status: string;
        holders_refunded: any;
        total_creds_refunded: number;
        refund_price: number;
    }>;
    /**
     * Nuke a prop market (freeze for 1 hour).
     * Costs 2,000 Chips. Per Blueprint §6.3.
     */
    nukePropMarket(userId: string, collegeDomain: string, eventId: string): Promise<{
        event_id: string;
        nuked_by: string;
        frozen_until: Date;
    }>;
    /**
     * Pin a rumor (Shoutout) for 10 minutes.
     * Costs 500 Chips. Per Blueprint §6.3.
     */
    buyShoutout(userId: string, collegeDomain: string, rumorId: string): Promise<{
        post_id: string;
        pinned_until: Date;
    }>;
    /**
     * Buy Golden Border for ticker (1 week).
     * Costs 1,000 Creds. Per Blueprint §6.3.
     *
     * FIX-B: ticker query now uses FOR UPDATE inside the queryRunner transaction.
     * Previously the ticker was fetched without a lock, creating a TOCTOU window
     * where a concurrent delist could set status = 'DELISTED' between the ticker
     * SELECT and the Cred deduction, charging the user for a delisted ticker.
     */
    buyGoldenBorder(userId: string): Promise<{
        ticker_id: any;
        golden_border_until: Date;
    }>;
}
