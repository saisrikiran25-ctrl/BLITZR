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
exports.PropEventEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let PropEventEntity = class PropEventEntity {
};
exports.PropEventEntity = PropEventEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PropEventEntity.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "creator_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'creator_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], PropEventEntity.prototype, "creator", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 500 }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "title", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', nullable: true }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "description", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "category", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['OPEN', 'PAUSED', 'CLOSED', 'SETTLED', 'CANCELLED'],
        default: 'OPEN',
    }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0.0 }),
    __metadata("design:type", Number)
], PropEventEntity.prototype, "yes_pool", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0.0 }),
    __metadata("design:type", Number)
], PropEventEntity.prototype, "no_pool", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: () => "'[]'" }),
    __metadata("design:type", Array)
], PropEventEntity.prototype, "options", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['YES', 'NO'], nullable: true }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "winning_outcome", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "referee_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity, { nullable: true }),
    (0, typeorm_1.JoinColumn)({ name: 'referee_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], PropEventEntity.prototype, "referee", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], PropEventEntity.prototype, "expiry_timestamp", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], PropEventEntity.prototype, "settled_at", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, default: 0.0 }),
    __metadata("design:type", Number)
], PropEventEntity.prototype, "listing_fee_paid", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 4, default: 0.05 }),
    __metadata("design:type", Number)
], PropEventEntity.prototype, "platform_fee_rate", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], PropEventEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['LOCAL', 'REGIONAL', 'NATIONAL'],
        default: 'LOCAL',
    }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "scope", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "institution_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PropEventEntity.prototype, "featured", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: 'iift.edu' }),
    __metadata("design:type", String)
], PropEventEntity.prototype, "college_domain", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], PropEventEntity.prototype, "updated_at", void 0);
exports.PropEventEntity = PropEventEntity = __decorate([
    (0, typeorm_1.Entity)('prop_events')
], PropEventEntity);
