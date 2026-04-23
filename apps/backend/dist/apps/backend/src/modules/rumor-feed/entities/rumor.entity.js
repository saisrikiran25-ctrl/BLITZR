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
exports.RumorEntity = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
let RumorEntity = class RumorEntity {
};
exports.RumorEntity = RumorEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RumorEntity.prototype, "post_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RumorEntity.prototype, "author_id", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'author_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], RumorEntity.prototype, "author", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 20 }),
    __metadata("design:type", String)
], RumorEntity.prototype, "ghost_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'text', name: 'text' }),
    __metadata("design:type", String)
], RumorEntity.prototype, "text", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', array: true, default: '{}' }),
    __metadata("design:type", Array)
], RumorEntity.prototype, "tagged_tickers", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'jsonb', default: {} }),
    __metadata("design:type", Object)
], RumorEntity.prototype, "price_snapshot", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['FACTUAL_CLAIM', 'OPINION', 'NEUTRAL'],
        default: 'NEUTRAL',
    }),
    __metadata("design:type", String)
], RumorEntity.prototype, "post_type", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['PUBLIC', 'PENDING', 'HIDDEN', 'REMOVED'],
        default: 'PUBLIC',
    }),
    __metadata("design:type", String)
], RumorEntity.prototype, "visibility", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 3, scale: 2, default: 0.0 }),
    __metadata("design:type", Number)
], RumorEntity.prototype, "risk_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], RumorEntity.prototype, "market_impact_triggered", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, nullable: true }),
    __metadata("design:type", Object)
], RumorEntity.prototype, "moderation_flag", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], RumorEntity.prototype, "credibility_rewarded", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: ['VISIBLE', 'PENDING_REVIEW', 'MODERATED', 'DELETED'],
        default: 'VISIBLE',
    }),
    __metadata("design:type", String)
], RumorEntity.prototype, "status", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 5, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], RumorEntity.prototype, "toxicity_score", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], RumorEntity.prototype, "upvotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', default: 0 }),
    __metadata("design:type", Number)
], RumorEntity.prototype, "downvotes", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], RumorEntity.prototype, "is_pinned", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'timestamptz', nullable: true }),
    __metadata("design:type", Date)
], RumorEntity.prototype, "pinned_until", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 100, default: 'iift.edu' }),
    __metadata("design:type", String)
], RumorEntity.prototype, "college_domain", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], RumorEntity.prototype, "created_at", void 0);
exports.RumorEntity = RumorEntity = __decorate([
    (0, typeorm_1.Entity)('rumor_posts')
], RumorEntity);
