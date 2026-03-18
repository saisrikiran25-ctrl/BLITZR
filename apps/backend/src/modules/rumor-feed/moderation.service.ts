import { Injectable } from '@nestjs/common';

@Injectable()
export class ModerationService {
    private readonly prohibitedKeywords = [
        'kill yourself',
        'suicide',
        'bomb threat',
        'terrorist',
        'sexual assault',
        'rape',
        'doxx',
    ];

    async checkProhibited(text: string): Promise<boolean> {
        const lower = text.toLowerCase();
        return this.prohibitedKeywords.some((keyword) => lower.includes(keyword));
    }
}
