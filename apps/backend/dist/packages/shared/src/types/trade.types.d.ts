export type TxType = 'BUY' | 'SELL' | 'BET' | 'DIVIDEND' | 'BURN' | 'EXCHANGE' | 'TRANSFER' | 'FEE';
export interface Transaction {
    tx_id: string;
    user_id: string;
    ticker_id?: string;
    prop_event_id?: string;
    tx_type: TxType;
    shares_quantity?: number;
    amount: number;
    price_at_execution?: number;
    supply_at_execution?: number;
    burn_amount: number;
    dividend_amount: number;
    platform_fee_amount: number;
    currency: 'CRED' | 'CHIP';
    created_at: string;
}
export interface TradeRequest {
    ticker_id: string;
    shares: number;
}
export interface TradePreview {
    ticker_id: string;
    shares: number;
    direction: 'BUY' | 'SELL';
    gross_cost: number;
    burn_fee: number;
    dividend_fee: number;
    net_cost: number;
    price_before: number;
    price_after: number;
    supply_before: number;
    supply_after: number;
}
export interface TradeResult {
    tx_id: string;
    ticker_id: string;
    shares: number;
    direction: 'BUY' | 'SELL';
    total_cost: number;
    new_price: number;
    new_supply: number;
    new_balance: number;
}
