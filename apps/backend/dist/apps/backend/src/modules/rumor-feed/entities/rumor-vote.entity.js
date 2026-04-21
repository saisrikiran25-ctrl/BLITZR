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
exports.RumorVoteEntity = exports.VoteType = void 0;
const typeorm_1 = require("typeorm");
const user_entity_1 = require("../../users/entities/user.entity");
const rumor_entity_1 = require("./rumor.entity");
var VoteType;
(function (VoteType) {
    VoteType["UP"] = "UP";
    VoteType["DOWN"] = "DOWN";
})(VoteType || (exports.VoteType = VoteType = {}));
let RumorVoteEntity = class RumorVoteEntity {
};
exports.RumorVoteEntity = RumorVoteEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], RumorVoteEntity.prototype, "vote_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid' }),
    __metadata("design:type", String)
], RumorVoteEntity.prototype, "user_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', name: 'rumor_id' }),
    __metadata("design:type", String)
], RumorVoteEntity.prototype, "post_id", void 0);
__decorate([
    (0, typeorm_1.Column)({
        type: 'enum',
        enum: VoteType,
    }),
    __metadata("design:type", String)
], RumorVoteEntity.prototype, "vote_type", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], RumorVoteEntity.prototype, "created_at", void 0);
__decorate([
    (0, typeorm_1.UpdateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], RumorVoteEntity.prototype, "updated_at", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => user_entity_1.UserEntity),
    (0, typeorm_1.JoinColumn)({ name: 'user_id' }),
    __metadata("design:type", user_entity_1.UserEntity)
], RumorVoteEntity.prototype, "user", void 0);
__decorate([
    (0, typeorm_1.ManyToOne)(() => rumor_entity_1.RumorEntity),
    (0, typeorm_1.JoinColumn)({ name: 'rumor_id' }),
    __metadata("design:type", rumor_entity_1.RumorEntity)
], RumorVoteEntity.prototype, "rumor", void 0);
exports.RumorVoteEntity = RumorVoteEntity = __decorate([
    (0, typeorm_1.Entity)('rumor_votes'),
    (0, typeorm_1.Unique)(['user_id', 'post_id'])
], RumorVoteEntity);
