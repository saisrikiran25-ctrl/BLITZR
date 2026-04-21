import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GoogleAuthDto {
    @ApiProperty({ description: 'The ID Token received from Google Sign-In' })
    @IsString()
    @IsNotEmpty()
    idToken: string;
}
