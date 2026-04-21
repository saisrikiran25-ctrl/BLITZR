"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PropMarketModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const prop_event_entity_1 = require("./entities/prop-event.entity");
const prop_bet_entity_1 = require("./entities/prop-bet.entity");
const prop_market_controller_1 = require("./prop-market.controller");
const markets_controller_1 = require("./markets.controller");
const prop_market_service_1 = require("./prop-market.service");
const jwt_or_admin_guard_1 = require("../../common/guards/jwt-or-admin.guard");
const users_module_1 = require("../users/users.module");
const realtime_module_1 = require("../realtime/realtime.module");
const notifications_module_1 = require("../notifications/notifications.module");
let PropMarketModule = class PropMarketModule {
};
exports.PropMarketModule = PropMarketModule;
exports.PropMarketModule = PropMarketModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([prop_event_entity_1.PropEventEntity, prop_bet_entity_1.PropBetEntity]),
            users_module_1.UsersModule,
            realtime_module_1.RealtimeModule,
            notifications_module_1.NotificationsModule,
        ],
        controllers: [prop_market_controller_1.PropMarketController, markets_controller_1.MarketsController],
        providers: [prop_market_service_1.PropMarketService, jwt_or_admin_guard_1.JwtOrAdminGuard],
        exports: [prop_market_service_1.PropMarketService],
    })
], PropMarketModule);
