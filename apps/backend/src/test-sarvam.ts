import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ClassifierService } from './modules/rumor-feed/classifier.service';

async function test() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const classifier = app.get(ClassifierService);
  const queries = ['fcuk you', 'Heil Hitler', 'bhenchod', 'this is a good app'];

  for (const q of queries) {
    console.log('TESTING:', q);
    const r = await classifier.classify(q);
    console.log('RESULT:', r);
  }

  await app.close();
}
test();
