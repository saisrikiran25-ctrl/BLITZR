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
    private sarvamAi?: OpenAI;
    private redisClient?: Redis;
    private readonly redisUrl: string;
    private readonly openAiKey: string;
    private readonly sarvamKey: string;

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
        this.sarvamKey = this.configService.get<string>('SARVAM_API_KEY', '');
    }

    async classify(text: string): Promise<ClassificationResult> {
        const tickers = this.extractTickers(text);

        const ruleResult = this.classifyRuleBased(text);
        if (ruleResult.confidence >= 0.8) {
            return { ...ruleResult, tickers };
        }

        const llmResult = await this.classifyWithLLM(text);
        
        // Sarvam AI (Unified Toxicity Control & Detection)
        const sarvamRisk = await this.checkSarvamToxicity(text);
        
        // Final risk calculation
        const finalRisk = Math.max(llmResult.risk_score, sarvamRisk);
        
        return { 
            post_type: llmResult.post_type, 
            risk_score: finalRisk, 
            confidence: llmResult.confidence, 
            tickers 
        };
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
            this.openai = new OpenAI({ apiKey: this.openAiKey || 'default-key' });
        }
        return this.openai;
    }

    private getSarvamClient(): OpenAI {
        if (!this.sarvamAi) {
            this.sarvamAi = new OpenAI({ 
                apiKey: this.sarvamKey || 'default-key',
                baseURL: 'https://api.sarvam.ai/v1' 
            });
        }
        return this.sarvamAi;
    }

    /**
     * Sarvam AI Unified Anti-Toxicity Control
     * Handles both general toxicity and regional/Hinglish nuance.
     */
    private async checkSarvamToxicity(text: string): Promise<number> {
        if (!this.sarvamKey) {
            this.logger.warn('SARVAM_API_KEY not set. Using fallback toxicity check.');
            const profanityAndSlang = ['shit', 'fuck', 'bitch', 'asshole', 'gaali', 'harami', 'kamina', 'bhenchod', 'chutiya'];
            if (profanityAndSlang.some(word => text.toLowerCase().includes(word))) {
                return 0.95; 
            }
            return 0.0;
        }

        try {
            this.logger.debug('Running Sarvam AI Toxicity check...');
            const sarvam = this.getSarvamClient();
            
            // ==========================================
            // USER'S CUSTOM ANTI-TOXICITY PROMPT GOES HERE
            // ==========================================
            const SYSTEM_PROMPT = `You are an uncompromising zero-tolerance anti-toxicity moderator for a campus network. Your sole purpose is to detect and flag any inappropriate content.

YOU MUST strictly identify and assign a risk_score of 1.0 if the text contains ANY of the following:
1. Vulgarity & Profanity: Any English or Hindi swearing, cursing, or bad words (e.g., "fuck", "bitch", "shit", "bhenchod", "chutiya", "madarchod", "gaali").
2. Evasion & Misspellings: Any attempt to bypass filters using misspellings, symbols, or leetspeak (e.g., "fcuk", "f*ck", "f u c k", "b!tch").
3. Hate Speech & Extremism: Any racist, religious abuse, or references to hate groups/figures used abusively (e.g., "Hitler", Nazi rhetoric, slurs).
4. Severe Bullying/Harassment.

If any of these are present, return EXACTLY: {"risk_score": 1.0}
If the text is completely clean and safe, return EXACTLY: {"risk_score": 0.0}

Return ONLY valid JSON with a single key "risk_score" from 0.0 to 1.0 representing the toxicity level.`;

            const response = await sarvam.chat.completions.create({
                model: 'sarvam-30b', // Sarvam recommended model
                messages: [
                    {
                        role: 'system',
                        content: SYSTEM_PROMPT,
                    },
                    { role: 'user', content: text },
                ],
                temperature: 0,
                max_tokens: 30,
            });

            const rawJson = response.choices[0]?.message?.content || '{}';
            // clean potential markdown wrappers from LLM output
            const cleaned = rawJson.replace(/```json/g, '').replace(/```/g, '');
            const parsed = JSON.parse(cleaned);
            return typeof parsed.risk_score === 'number' ? parsed.risk_score : 0.0;
        } catch (error) {
            this.logger.error('Sarvam AI Toxicity Check Failed', error);
            return 0.0;
        }
    }
}
