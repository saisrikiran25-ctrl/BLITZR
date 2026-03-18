import { ClassifierService } from '../src/modules/rumor-feed/classifier.service';

describe('ClassifierService', () => {
    const service = new ClassifierService({ get: () => '' } as any);

    it('classifies factual claims with tickers via rule-based layer', async () => {
        const result = await service.classify('Just saw $PRIYA got caught cheating outside the dorms.');
        expect(result.post_type).toBe('FACTUAL_CLAIM');
        expect(result.tickers).toContain('PRIYA');
        expect(result.risk_score).toBeGreaterThanOrEqual(0.4);
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });

    it('classifies opinions via rule-based layer', async () => {
        const result = await service.classify('I think $RAHUL is overrated.');
        expect(result.post_type).toBe('OPINION');
        expect(result.risk_score).toBe(0.1);
        expect(result.confidence).toBeGreaterThanOrEqual(0.8);
    });
});
