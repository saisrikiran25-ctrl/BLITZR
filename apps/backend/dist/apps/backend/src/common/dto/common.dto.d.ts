export declare class CreateIpoDto {
    ticker_symbol: string;
    category?: string;
}
export declare class TradeDto {
    ticker_id: string;
    shares: number;
}
export declare class PlaceBetDto {
    event_id: string;
    outcome: 'YES' | 'NO';
    chip_amount: number;
}
export declare class CreateEventDto {
    title: string;
    description?: string;
    category?: string;
    expiry_timestamp: string;
    referee_id?: string;
    listing_fee?: number;
}
export declare class ExchangeDto {
    amount: number;
}
export declare class CreateRumorDto {
    content: string;
}
