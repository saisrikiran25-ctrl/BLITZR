"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.TradingModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const transaction_entity_1 = require("./entities/transaction.entity");
const ohlc_candle_entity_1 = require("./entities/ohlc-candle.entity");
const trading_controller_1 = require("./trading.controller");
const trading_service_1 = require("./trading.service");
const trade_queue_service_1 = require("./trade-queue.service");
const ohlc_aggregation_service_1 = require("./ohlc-aggregation.service");
const ipo_module_1 = require("../ipo/ipo.module");
const users_module_1 = require("../users/users.module");
const realtime_module_1 = require("../realtime/realtime.module");
const notifications_module_1 = require("../notifications/notifications.module");
let TradingModule = class TradingModule {
};
exports.TradingModule = TradingModule;
exports.TradingModule = TradingModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([transaction_entity_1.TransactionEntity, ohlc_candle_entity_1.OhlcCandleEntity]),
            ipo_module_1.IpoModule,
            users_module_1.UsersModule,
            realtime_module_1.RealtimeModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [trading_controller_1.TradingController],
        providers: [trading_service_1.TradingService, trade_queue_service_1.TradeQueueService, ohlc_aggregation_service_1.OhlcAggregationService],
        exports: [trading_service_1.TradingService, trade_queue_service_1.TradeQueueService, ohlc_aggregation_service_1.OhlcAggregationService],
    })
], TradingModule);
