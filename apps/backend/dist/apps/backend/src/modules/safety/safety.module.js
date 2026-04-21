"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SafetyModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ticker_entity_1 = require("../ipo/entities/ticker.entity");
const crash_protector_service_1 = require("./crash-protector.service");
const unfreeze_service_1 = require("./unfreeze.service");
const ipo_module_1 = require("../ipo/ipo.module");
const notification_service_1 = require("../../common/services/notification.service");
const config_1 = require("@nestjs/config");
let SafetyModule = class SafetyModule {
};
exports.SafetyModule = SafetyModule;
exports.SafetyModule = SafetyModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule,
            typeorm_1.TypeOrmModule.forFeature([ticker_entity_1.TickerEntity]),
            ipo_module_1.IpoModule,
        ],
        providers: [
            crash_protector_service_1.CrashProtectorService,
            unfreeze_service_1.UnfreezeService,
            notification_service_1.NotificationService,
        ],
        exports: []
    })
], SafetyModule);
