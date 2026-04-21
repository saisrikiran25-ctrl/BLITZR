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
exports.NationalLeaderboardEntity = void 0;
const typeorm_1 = require("typeorm");
let NationalLeaderboardEntity = class NationalLeaderboardEntity {
};
exports.NationalLeaderboardEntity = NationalLeaderboardEntity;
__decorate([
    (0, typeorm_1.PrimaryGeneratedColumn)('uuid'),
    __metadata("design:type", String)
], NationalLeaderboardEntity.prototype, "entry_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'varchar', length: 50, nullable: true }),
    __metadata("design:type", String)
], NationalLeaderboardEntity.prototype, "ticker_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'uuid', nullable: true }),
    __metadata("design:type", String)
], NationalLeaderboardEntity.prototype, "institution_id", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], NationalLeaderboardEntity.prototype, "campus_rank", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'integer', nullable: true }),
    __metadata("design:type", Number)
], NationalLeaderboardEntity.prototype, "national_rank", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], NationalLeaderboardEntity.prototype, "snapshot_price", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'decimal', precision: 18, scale: 4, nullable: true }),
    __metadata("design:type", Number)
], NationalLeaderboardEntity.prototype, "snapshot_volume", void 0);
__decorate([
    (0, typeorm_1.Column)({ type: 'boolean', default: false }),
    __metadata("design:type", Boolean)
], NationalLeaderboardEntity.prototype, "featured", void 0);
__decorate([
    (0, typeorm_1.CreateDateColumn)({ type: 'timestamptz' }),
    __metadata("design:type", Date)
], NationalLeaderboardEntity.prototype, "computed_at", void 0);
exports.NationalLeaderboardEntity = NationalLeaderboardEntity = __decorate([
    (0, typeorm_1.Entity)('national_leaderboard')
], NationalLeaderboardEntity);
