import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import OpenAI from 'openai';
import Redis from 'ioredis';

export interface ClassificationResult {
    post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL';
    risk_score: number;
    confidence: number;
    tickers: string[];
}

@Injectable()
export class ClassifierService {
    private readonly logger = new Logger(ClassifierService.name);
    private openai: OpenAI;
    private redisClient: Redis;

    // Rule-based dictionaries
    private factualIndicators = [
        'will acquire', 'merger', 'resigning', 'firing', 'bankrupt',
        'lawsuit', 'investigation', 'earnings', 'revenue up', 'revenue down'
    ];
    private opinionIndicators = [
        'i think', 'maybe', 'probably', 'looks like', 'in my opinion',
        'feeling bearish', 'feeling bullish', 'might', 'could be'
    ];

    constructor(private configService: ConfigService) {
        this.openai = new OpenAI({
            apiKey: this.configService.get<string>('OPENAI_API_KEY', 'default-key-for-typing'),
        });
        
        // Connect to Redis for caching
        const redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        this.redisClient = new Redis(redisUrl);
    }

    async classify(text: string): Promise<ClassificationResult> {
        // Step 1: Extract Tickers
        const tickers = this.extractTickers(text);

        // Step 2: Layer A - Rule Based First Pass
        const heuristicResult = this.classifyRuleBased(text);
        if (heuristicResult && heuristicResult.confidence >= 0.8) {
            this.logger.debug(`Rule-based classification succeeded: ${heuristicResult.post_type}`);
            return {
                ...heuristicResult,
                tickers
            };
        }

        // Step 3: Layer B - LLM Fallback
        const llmResult = await this.classifyWithLLM(text);
        
        // Merge with tickers
        return {
            ...llmResult,
            tickers
        };
    }

    private extractTickers(text: string): string[] {
        const regex = /\$[A-Z]+/g;
        const matches = text.match(regex);
        return matches ? Array.from(new Set(matches.map(t => t.replace('$', '')))) : [];
    }

    private classifyRuleBased(text: string): { post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL', risk_score: number, confidence: number } | null {
        const lowerText = text.toLowerCase();
        
        // Check exact opinion matches first (safest)
        const hasOpinion = this.opinionIndicators.some(ind => lowerText.includes(ind));
        if (hasOpinion) {
            return { post_type: 'OPINION', risk_score: 0.2, confidence: 0.85 };
        }

        // Check factual phrase matches
        const hasFactual = this.factualIndicators.some(ind => lowerText.includes(ind));
        if (hasFactual) {
            return { post_type: 'FACTUAL_CLAIM', risk_score: 0.8, confidence: 0.9 };
        }

        return null; // Force fallback to LLM
    }

    private async classifyWithLLM(text: string): Promise<{ post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL', risk_score: number, confidence: number }> {
        const cacheKey = `blitzr:classification:${Buffer.from(text).toString('base64')}`;
        
        try {
            // Check Redis Cache
            const cached = await this.redisClient.get(cacheKey);
            if (cached) {
                this.logger.debug('Cache hit for classification');
                return JSON.parse(cached);
            }

            // Fallback to OpenAI API
            const response = await this.openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a financial NLP safety classifier. Categorize the user's post as exactly one of: FACTUAL_CLAIM, OPINION, NEUTRAL. Also estimate a risk_score from 0.0 to 1.0. High risk is a definitive statement about an upcoming event that impacts prices. Return exactly JSON format: { "post_type": "...", "risk_score": 0.0, "confidence": 0.0 }`
                    },
                    {
                        role: 'user',
                        content: text
                    }
                ],
                response_format: { type: 'json_object' }
            });

            const rawJson = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(rawJson);

            const result = {
                post_type: parsed.post_type || 'NEUTRAL',
                risk_score: typeof parsed.risk_score === 'number' ? parsed.risk_score : 0.0,
                confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9
            };

            // Cache for 30 minutes
            await this.redisClient.set(cacheKey, JSON.stringify(result), 'EX', 1800);
            
            return result as object as any;

        } catch (error) {
            this.logger.error('LLM Classification Failed', error);
            // Fallback fail-open to Neutral if API goes down
            return { post_type: 'NEUTRAL', risk_score: 0.0, confidence: 1.0 };
        }
    }
}
