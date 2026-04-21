"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const classifier_service_1 = require("./modules/rumor-feed/classifier.service");
async function test() {
    const app = await core_1.NestFactory.createApplicationContext(app_module_1.AppModule);
    const classifier = app.get(classifier_service_1.ClassifierService);
    const queries = ['FUCK OFF', 'Heil Hitler'];
    for (const q of queries) {
        console.log('TESTING:', q);
        const r = await classifier.classify(q);
        console.log('RESULT:', r);
    }
    await app.close();
}
test();
