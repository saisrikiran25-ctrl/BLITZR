import { IsString, IsNotEmpty, IsOptional, Length, Matches, IsBoolean } from 'class-validator';

export class RegisterDto {
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    @Length(3, 20)
    @Matches(/^[a-zA-Z0-9_]+$/, { message: 'Username must be alphanumeric or underscores' })
    username: string;

    @IsString()
    @IsNotEmpty()
    @Length(8, 128)
    password: string;

    @IsOptional()
    @IsString()
    displayName?: string;

    @IsOptional()
    @IsString()
    campus?: string;

    @IsOptional()
    @IsString()
    institution_id?: string;

    @IsOptional()
    @IsBoolean()
    // Accepted for client compatibility; registration source of truth remains backend defaults.
    tosAccepted?: boolean;
}

export class LoginDto {
    @IsString()
    @IsNotEmpty()
    email: string;

    @IsString()
    @IsNotEmpty()
    password: string;
}
