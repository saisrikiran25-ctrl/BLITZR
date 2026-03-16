import { IsString, IsNotEmpty, IsInt, Min, IsOptional } from 'class-validator';

export class CreateIpoDto {
    @IsString()
    @IsNotEmpty()
    ticker_symbol: string;

    @IsOptional()
    @IsString()
    category?: string;
}

export class TradeDto {
    @IsString()
    @IsNotEmpty()
    ticker_id: string;

    @IsInt()
    @Min(1)
    shares: number;
}

export class PlaceBetDto {
    @IsString()
    @IsNotEmpty()
    event_id: string;

    @IsString()
    outcome: 'YES' | 'NO';

    @IsInt()
    @Min(1)
    chip_amount: number;
}

export class CreateEventDto {
    @IsString()
    @IsNotEmpty()
    title: string;

    @IsOptional()
    @IsString()
    description?: string;

    @IsOptional()
    @IsString()
    category?: string;

    @IsString()
    @IsNotEmpty()
    expiry_timestamp: string;

    @IsOptional()
    @IsString()
    referee_id?: string;

    @IsOptional()
    @IsInt()
    @Min(0)
    listing_fee?: number;
}

export class ExchangeDto {
    @IsInt()
    @Min(1)
    amount: number;
}

export class CreateRumorDto {
    @IsString()
    @IsNotEmpty()
    content: string;
}
