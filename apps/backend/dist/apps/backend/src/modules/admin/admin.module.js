"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminModule = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const admin_analytics_entity_1 = require("./entities/admin-analytics.entity");
const admin_analytics_service_1 = require("./admin-analytics.service");
const admin_controller_1 = require("./admin.controller");
const admin_auth_controller_1 = require("./admin-auth.controller");
const admin_auth_service_1 = require("./admin-auth.service");
const admin_jwt_strategy_1 = require("./strategies/admin-jwt.strategy");
const admin_jwt_guard_1 = require("./guards/admin-jwt.guard");
const user_entity_1 = require("../users/entities/user.entity");
const ticker_entity_1 = require("../ipo/entities/ticker.entity");
const users_module_1 = require("../users/users.module");
const ipo_module_1 = require("../ipo/ipo.module");
const prop_market_module_1 = require("../prop-market/prop-market.module");
let AdminModule = class AdminModule {
};
exports.AdminModule = AdminModule;
exports.AdminModule = AdminModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([
                admin_analytics_entity_1.AdminAnalyticsEntity,
                user_entity_1.UserEntity,
                ticker_entity_1.TickerEntity
            ]),
            users_module_1.UsersModule,
            ipo_module_1.IpoModule,
            prop_market_module_1.PropMarketModule,
            jwt_1.JwtModule.registerAsync({
                imports: [config_1.ConfigModule],
                inject: [config_1.ConfigService],
                useFactory: (configService) => ({
                    secret: configService.get('ADMIN_JWT_SECRET', 'blitzr-admin-secret'),
                    signOptions: { expiresIn: '12h' },
                }),
            }),
        ],
        controllers: [admin_controller_1.AdminController, admin_auth_controller_1.AdminAuthController],
        providers: [admin_analytics_service_1.AdminAnalyticsService, admin_auth_service_1.AdminAuthService, admin_jwt_strategy_1.AdminJwtStrategy, admin_jwt_guard_1.AdminJwtGuard],
        exports: [admin_jwt_guard_1.AdminJwtGuard],
    })
], AdminModule);
