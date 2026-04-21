export declare class ModerationService {
    private readonly prohibitedKeywords;
    checkProhibited(text: string): Promise<boolean>;
}
