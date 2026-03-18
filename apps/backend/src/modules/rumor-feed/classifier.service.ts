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
    private openai?: OpenAI;
    private redisClient?: Redis;
    private readonly redisUrl: string;
    private readonly openAiKey: string;

    // Rule-based dictionaries
    private factualIndicators = [
        'just saw', 'i heard', 'confirmed', 'sources say', 'apparently',
        'walking into', 'coming out of', 'was at', 'got caught',
        'failed', 'expelled', 'arrested', 'cheated', 'broke up',
        'escorted', 'suspended', 'rumor is', 'word is',
    ];
    private opinionIndicators = [
        'i think', 'probably', 'might', 'could be', 'in my opinion',
        'overrated', 'underrated', 'deserves', 'should be', 'feels like',
        'seems like', 'i believe', 'not sure but',
    ];

    constructor(private configService: ConfigService) {
        this.redisUrl = this.configService.get<string>('REDIS_URL', 'redis://localhost:6379');
        this.openAiKey = this.configService.get<string>('OPENAI_API_KEY', 'default-key-for-typing');
    }

    async classify(text: string): Promise<ClassificationResult> {
        const tickers = this.extractTickers(text);

        const ruleResult = this.classifyRuleBased(text);
        if (ruleResult.confidence >= 0.8) {
            return { ...ruleResult, tickers };
        }

        const llmResult = await this.classifyWithLLM(text);
        return { ...llmResult, tickers };
    }

    private extractTickers(text: string): string[] {
        const regex = /\$[A-Z]{2,15}/g;
        const matches = text.match(regex);
        return matches ? Array.from(new Set(matches.map(t => t.replace('$', '')))) : [];
    }

    public classifyRuleBased(text: string): { post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL'; risk_score: number; confidence: number; tickers: string[] } {
        const lower = text.toLowerCase();
        const tickers = this.extractTickers(text);

        const factualScore = this.factualIndicators.filter((i) => lower.includes(i)).length;
        const opinionScore = this.opinionIndicators.filter((i) => lower.includes(i)).length;

        const pastTensePattern = /\$(saw|went|was|got|had|did|said|told|heard)/i;
        const hasPastTenseWithTicker = tickers.length > 0 && pastTensePattern.test(text);

        if (factualScore > 0 || hasPastTenseWithTicker) {
            const risk = Math.min(0.4 + (factualScore * 0.15) + (tickers.length * 0.1), 1.0);
            return { post_type: 'FACTUAL_CLAIM', confidence: 0.85, risk_score: risk, tickers };
        }

        if (opinionScore > 0) {
            return { post_type: 'OPINION', confidence: 0.9, risk_score: 0.1, tickers };
        }

        return { post_type: 'NEUTRAL', confidence: 0.7, risk_score: 0.05, tickers };
    }

    private async classifyWithLLM(text: string): Promise<{ post_type: 'FACTUAL_CLAIM' | 'OPINION' | 'NEUTRAL'; risk_score: number; confidence: number }> {
        const cacheKey = `classify:${Buffer.from(text).toString('base64').slice(0, 32)}`;
        const redisClient = this.getRedisClient();

        try {
            const cached = await redisClient.get(cacheKey);
            if (cached) {
                return JSON.parse(cached);
            }

            const openai = this.getOpenAIClient();
            const response = await openai.chat.completions.create({
                model: 'gpt-4o-mini',
                messages: [
                    {
                        role: 'system',
                        content: `You are a content classifier for a campus social app. Classify the post as one of:
- FACTUAL_CLAIM: Makes a specific claim about a real person's actions or situation
- OPINION: Expresses a subjective view or prediction
- NEUTRAL: General commentary with no specific claim about a person
Return a risk_score from 0.0 to 1.0 where 1.0 = could seriously damage someone's reputation if false.
Return ONLY valid JSON: {"post_type": "...", "risk_score": 0.0}`,
                    },
                    { role: 'user', content: text },
                ],
                temperature: 0,
                max_tokens: 60,
            });

            const rawJson = response.choices[0]?.message?.content || '{}';
            const parsed = JSON.parse(rawJson);
            const result = {
                post_type: parsed.post_type || 'NEUTRAL',
                risk_score: typeof parsed.risk_score === 'number' ? parsed.risk_score : 0.0,
                confidence: 0.75,
            };

            await redisClient.set(cacheKey, JSON.stringify(result), 'EX', 3600);
            return result;
        } catch (error) {
            this.logger.error('LLM Classification Failed', error);
            return { post_type: 'NEUTRAL', risk_score: 0.0, confidence: 1.0 };
        }
    }

    private getRedisClient(): Redis {
        if (!this.redisClient) {
            this.redisClient = new Redis(this.redisUrl);
        }
        return this.redisClient;
    }

    private getOpenAIClient(): OpenAI {
        if (!this.openai) {
            this.openai = new OpenAI({ apiKey: this.openAiKey });
        }
        return this.openai;
    }
}
