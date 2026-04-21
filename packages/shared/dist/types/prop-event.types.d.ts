export type PropEventStatus = 'OPEN' | 'CLOSED' | 'SETTLED' | 'CANCELLED';
export type PropOutcome = 'YES' | 'NO';
export interface PropEvent {
    event_id: string;
    creator_id: string;
    title: string;
    description?: string;
    category?: string;
    status: PropEventStatus;
    yes_pool: number;
    no_pool: number;
    winning_outcome?: PropOutcome;
    referee_id?: string;
    expiry_timestamp: string;
    settled_at?: string;
    listing_fee_paid: number;
    platform_fee_rate: number;
    created_at: string;
    updated_at: string;
}
export interface PropEventWithOdds extends PropEvent {
    total_pool: number;
    yes_odds: number;
    no_odds: number;
    time_remaining_ms: number;
}
export interface PropBet {
    bet_id: string;
    event_id: string;
    user_id: string;
    outcome_choice: PropOutcome;
    chip_amount: number;
    payout_amount?: number;
    is_settled: boolean;
    created_at: string;
}
export interface PlaceBetRequest {
    event_id: string;
    outcome: PropOutcome;
    chip_amount: number;
}
export interface CreatePropEventRequest {
    title: string;
    description?: string;
    category?: string;
    expiry_timestamp: string;
    referee_id?: string;
}
//# sourceMappingURL=prop-event.types.d.ts.map