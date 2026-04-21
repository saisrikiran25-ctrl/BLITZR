"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HoldingEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const ticker_entity_1 = require("./ticker.entity");
let HoldingEntity = class HoldingEntity {
};
exports.HoldingEntity = HoldingEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], HoldingEntity.prototype, "holding_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], HoldingEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], HoldingEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], HoldingEntity.prototype, "ticker_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ticker_entity_1.TickerEntity),
    (0, typeorm_1.JoinColumn)({ name: 'ticker_id' }),
    __metadata("design:type", ticker_entity_1.TickerEntity)
], HoldingEntity.prototype, "ticker", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], HoldingEntity.prototype, "shares_held", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0.0 }),
    __metadata("design:type", Number)
], HoldingEntity.prototype, "avg_buy_price", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], HoldingEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], HoldingEntity.prototype, "updated_at", void 0);
exports.HoldingEntity = HoldingEntity = __decorate([
    (0, typeorm_1.Entity)('holdings'),
    (0, typeorm_1.Unique)('uq_user_ticker', ['user_id', 'ticker_id'])
], HoldingEntity);
