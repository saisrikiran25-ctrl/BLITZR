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
exports.TickerEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let TickerEntity = class TickerEntity {
};
exports.TickerEntity = TickerEntity;
__decorate([
    (0, typeorm_1.PrimaryColumn)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], TickerEntity.prototype, "ticker_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TickerEntity.prototype, "owner_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'owner_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], TickerEntity.prototype, "owner", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 1 }),
    __metadata("design:type", Number)
], TickerEntity.prototype, "current_supply", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 200.0 }),
    __metadata("design:type", Number)
], TickerEntity.prototype, "scaling_constant", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0.005 }),
    __metadata("design:type", Number)
], TickerEntity.prototype, "price_open", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0.0 }),
    __metadata("design:type", Number)
], TickerEntity.prototype, "total_volume", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], TickerEntity.prototype, "total_trades", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], TickerEntity.prototype, "human_trades_1h", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['ACTIVE', 'FROZEN', 'AUTO_FROZEN', 'MANUAL_FROZEN', 'PENDING', 'DELISTED'],
        default: 'ACTIVE',
    }),
    __metadata("design:type", String)
], TickerEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], TickerEntity.prototype, "frozen_until", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", String)
], TickerEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TickerEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: 'iift.edu' }),
    __metadata("design:type", String)
], TickerEntity.prototype, "college_domain", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TickerEntity.prototype, "updated_at", void 0);
exports.TickerEntity = TickerEntity = __decorate([
    (0, typeorm_1.Entity)('tickers')
], TickerEntity);
