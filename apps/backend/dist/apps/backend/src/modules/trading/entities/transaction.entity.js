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
exports.TransactionEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const ticker_entity_1 = require("../../ipo/entities/ticker.entity");
let TransactionEntity = class TransactionEntity {
};
exports.TransactionEntity = TransactionEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], TransactionEntity.prototype, "tx_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], TransactionEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "ticker_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ticker_entity_1.TickerEntity, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'ticker_id' }),
    __metadata("design:type", ticker_entity_1.TickerEntity)
], TransactionEntity.prototype, "ticker", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "prop_event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['BUY', 'SELL', 'BET', 'DIVIDEND', 'BURN', 'EXCHANGE', 'TRANSFER', 'FEE'],
    }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "tx_type", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], TransactionEntity.prototype, "shares_quantity", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], TransactionEntity.prototype, "amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], TransactionEntity.prototype, "price_at_execution", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', nullable: true }),
    __metadata("design:type", Number)
], TransactionEntity.prototype, "supply_at_execution", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0.0 }),
    __metadata("design:type", Number)
], TransactionEntity.prototype, "burn_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0.0 }),
    __metadata("design:type", Number)
], TransactionEntity.prototype, "dividend_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0.0 }),
    __metadata("design:type", Number)
], TransactionEntity.prototype, "platform_fee_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 10, default: 'CRED' }),
    __metadata("design:type", String)
], TransactionEntity.prototype, "currency", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], TransactionEntity.prototype, "created_at", void 0);
exports.TransactionEntity = TransactionEntity = __decorate([
    (0, typeorm_1.Entity)('transactions')
], TransactionEntity);
