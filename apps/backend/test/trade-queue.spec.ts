import { ConfigService } from '@nestjs/config';
import { TradeQueueService } from '../src/modules/trading/trade-queue.service';
import { TradingService } from '../src/modules/trading/trading.service';

describe('TradeQueueService', () => {
    test('requeueProcessing moves in-flight items back to the main queue', async () => {
        const configService = {
            get: jest.fn(),
        } as unknown as ConfigService;
        const tradingService = {
            executeBuy: jest.fn(),
            executeSell: jest.fn(),
        } as unknown as TradingService;

        const service = new TradeQueueService(configService, tradingService);
        const rpoplpush = jest
            .fn()
            .mockResolvedValueOnce('trade-1')
            .mockResolvedValueOnce('trade-2')
            .mockResolvedValueOnce(null);
        const warnSpy = jest.spyOn((service as any).logger, 'warn').mockImplementation();

        (service as any).redisWorker = { rpoplpush };
        (service as any).shuttingDown = false;

        await (service as any).requeueProcessing(
            'queue:trade:PRIYA',
            'queue:trade:PRIYA:processing',
        );

        expect(rpoplpush).toHaveBeenCalledTimes(3);
        expect(rpoplpush).toHaveBeenNthCalledWith(
            1,
            'queue:trade:PRIYA:processing',
            'queue:trade:PRIYA',
        );
        expect(rpoplpush).toHaveBeenNthCalledWith(
            2,
            'queue:trade:PRIYA:processing',
            'queue:trade:PRIYA',
        );
        expect(rpoplpush).toHaveBeenNthCalledWith(
            3,
            'queue:trade:PRIYA:processing',
            'queue:trade:PRIYA',
        );
        expect(warnSpy).toHaveBeenCalledWith(
            'Requeued 2 in-flight trade(s) for queue:trade:PRIYA after worker restart.',
        );
    });
});
