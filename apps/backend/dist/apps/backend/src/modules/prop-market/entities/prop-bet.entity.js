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
exports.PropBetEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const prop_event_entity_1 = require("./prop-event.entity");
let PropBetEntity = class PropBetEntity {
};
exports.PropBetEntity = PropBetEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], PropBetEntity.prototype, "bet_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PropBetEntity.prototype, "event_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => prop_event_entity_1.PropEventEntity),
    (0, typeorm_1.JoinColumn)({ name: 'event_id' }),
    __metadata("design:type", prop_event_entity_1.PropEventEntity)
], PropBetEntity.prototype, "event", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], PropBetEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], PropBetEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'enum', enum: ['YES', 'NO'] }),
    __metadata("design:type", String)
], PropBetEntity.prototype, "outcome_choice", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4 }),
    __metadata("design:type", Number)
], PropBetEntity.prototype, "chip_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], PropBetEntity.prototype, "payout_amount", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], PropBetEntity.prototype, "is_settled", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], PropBetEntity.prototype, "created_at", void 0);
exports.PropBetEntity = PropBetEntity = __decorate([
    (0, typeorm_1.Entity)('prop_bets')
], PropBetEntity);
