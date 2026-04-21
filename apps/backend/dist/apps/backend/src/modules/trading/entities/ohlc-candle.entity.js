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
exports.OhlcCandleEntity = void 0;
const typeorm_1 = require("typeorm");
const ticker_entity_1 = require("../../ipo/entities/ticker.entity");
/**
 * OHLC Candles Entity
 * Pre-aggregated chart data for line/candle rendering.
 * Intervals: 1m, 5m, 1h, 1d
 *
 * Per PRD §6.2
 */
let OhlcCandleEntity = class OhlcCandleEntity {
};
exports.OhlcCandleEntity = OhlcCandleEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], OhlcCandleEntity.prototype, "candle_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50 }),
    __metadata("design:type", String)
], OhlcCandleEntity.prototype, "ticker_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => ticker_entity_1.TickerEntity),
    (0, typeorm_1.JoinColumn)({ name: 'ticker_id' }),
    __metadata("design:type", ticker_entity_1.TickerEntity)
], OhlcCandleEntity.prototype, "ticker", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['1m', '5m', '1h', '1d'],
    }),
    __metadata("design:type", String)
], OhlcCandleEntity.prototype, "interval", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], OhlcCandleEntity.prototype, "open_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], OhlcCandleEntity.prototype, "high_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], OhlcCandleEntity.prototype, "low_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], OhlcCandleEntity.prototype, "close_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'bigint', default: 0 }),
    __metadata("design:type", Number)
], OhlcCandleEntity.prototype, "volume", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], OhlcCandleEntity.prototype, "trade_count", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OhlcCandleEntity.prototype, "bucket_start", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], OhlcCandleEntity.prototype, "created_at", void 0);
exports.OhlcCandleEntity = OhlcCandleEntity = __decorate([
    (0, typeorm_1.Entity)('ohlc_candles')
], OhlcCandleEntity);
