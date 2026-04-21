"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.IpoModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const ticker_entity_1 = require("./entities/ticker.entity");
const holding_entity_1 = require("./entities/holding.entity");
const ipo_controller_1 = require("./ipo.controller");
const ipo_service_1 = require("./ipo.service");
const ipo_delist_service_1 = require("./ipo-delist.service");
const bonding_curve_service_1 = require("./bonding-curve.service");
const users_module_1 = require("../users/users.module");
let IpoModule = class IpoModule {
};
exports.IpoModule = IpoModule;
exports.IpoModule = IpoModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([ticker_entity_1.TickerEntity, holding_entity_1.HoldingEntity]),
            users_module_1.UsersModule,
        ],
        controllers: [ipo_controller_1.IpoController],
        providers: [ipo_service_1.IpoService, ipo_delist_service_1.IpoDelistService, bonding_curve_service_1.BondingCurveService],
        exports: [ipo_service_1.IpoService, ipo_delist_service_1.IpoDelistService, bonding_curve_service_1.BondingCurveService],
    })
], IpoModule);
