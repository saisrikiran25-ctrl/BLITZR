"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const schedule_1 = require("@nestjs/schedule");
const core_1 = require("@nestjs/core");
const tos_guard_1 = require("./common/guards/tos.guard");
const serve_static_1 = require("@nestjs/serve-static");
const path_1 = require("path");
// Feature Modules
const auth_module_1 = require("./modules/auth/auth.module");
const users_module_1 = require("./modules/users/users.module");
const ipo_module_1 = require("./modules/ipo/ipo.module");
const trading_module_1 = require("./modules/trading/trading.module");
const prop_market_module_1 = require("./modules/prop-market/prop-market.module");
const rumor_feed_module_1 = require("./modules/rumor-feed/rumor-feed.module");
const wallet_module_1 = require("./modules/wallet/wallet.module");
const realtime_module_1 = require("./modules/realtime/realtime.module");
const market_maker_module_1 = require("./modules/market-maker/market-maker.module");
const safety_module_1 = require("./modules/safety/safety.module");
const admin_module_1 = require("./modules/admin/admin.module");
const leaderboard_module_1 = require("./modules/leaderboard/leaderboard.module");
const notifications_module_1 = require("./modules/notifications/notifications.module");
// Database config
const database_config_1 = require("./config/database.config");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            // Configuration (env vars)
            config_1.ConfigModule.forRoot({
                isGlobal: true,
                envFilePath: '.env',
            }),
            // Static Frontend
            serve_static_1.ServeStaticModule.forRoot({
                rootPath: (0, path_1.join)(__dirname, '..', '..', '..', 'client'),
                exclude: ['/api/(.*)'],
            }),
            // PostgreSQL via TypeORM
            typeorm_1.TypeOrmModule.forRootAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: database_config_1.getDatabaseConfig,
            }),
            // Cron scheduling (Market Maker bot)
            schedule_1.ScheduleModule.forRoot(),
            // Feature modules
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            ipo_module_1.IpoModule,
            trading_module_1.TradingModule,
            prop_market_module_1.PropMarketModule,
            rumor_feed_module_1.RumorFeedModule,
            wallet_module_1.WalletModule,
            realtime_module_1.RealtimeModule,
            market_maker_module_1.MarketMakerModule,
            safety_module_1.SafetyModule,
            admin_module_1.AdminModule,
            leaderboard_module_1.LeaderboardModule,
            notifications_module_1.NotificationsModule,
        ],
        providers: [
            {
                provide: core_1.APP_GUARD,
                useClass: tos_guard_1.TosGuard,
            },
        ]
    })
], AppModule);
