import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreateRumorDto {
    @IsString()
    @IsNotEmpty()
    @IsOptional()
    text?: string;

    @IsString()
    @IsNotEmpty()
    @IsOptional()
    content?: string;
}
