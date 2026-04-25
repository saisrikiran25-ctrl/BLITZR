// apps/backend/scratch/debug_trade.ts
import { NestFactory } from '@nestjs/core';
import { AppModule } from '../src/app.module';
import { TradingService } from '../src/modules/trading/trading.service';

async function bootstrap() {
    const app = await NestFactory.createApplicationContext(AppModule);
    const tradingService = app.get(TradingService);

    const userId = 'c8789505-ff36-407b-891d-556b60e6e765'; // Need a valid ID from your DB
    const collegeDomain = 'IIFT-D';
    const tickerId = 'SAKSHAMIPM25';

    console.log('--- STARTING FORENSIC TRADE TEST ---');
    try {
        const result = await tradingService.executeBuy(userId, collegeDomain, tickerId, 1);
        console.log('SUCCESS:', result);
    } catch (e: any) {
        console.error('CRASH DETECTED!');
        console.error('Error Name:', e.name);
        console.error('Error Message:', e.message);
        console.error('Stack Trace:', e.stack);
    } finally {
        await app.close();
    }
}

bootstrap();
