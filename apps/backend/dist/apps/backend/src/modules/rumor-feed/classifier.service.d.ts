import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
export interface ClassificationResult {
    post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL';
    risk_score: number;
    confidence: number;
    tickers: string[];
}
export declare class ClassifierService implements OnModuleInit, OnModuleDestroy {
    private configService;
    private readonly logger;
    private openai?;
    private sarvamAi?;
    private redisClient?;
    private readonly redisUrl;
    private readonly openAiKey;
    private readonly sarvamKey;
    private factualIndicators;
    private opinionIndicators;
    constructor(configService: ConfigService);
    onModuleInit(): Promise<void>;
    onModuleDestroy(): void;
    classify(text: string): Promise<ClassificationResult>;
    private extractTickers;
    classifyRuleBased(text: string): {
        post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL';
        risk_score: number;
        confidence: number;
        tickers: string[];
    };
    private classifyWithLLM;
    private getRedisClient;
    private getOpenAIClient;
    private getSarvamClient;
    /**
     * Sarvam AI Unified Anti-Toxicity Control
     * Handles both general toxicity and regional/Hinglish nuance.
     */
    private checkSarvamToxicity;
}
