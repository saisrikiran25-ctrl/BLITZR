"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.RumorFeedModule = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const rumor_entity_1 = require("./entities/rumor.entity");
const rumor_vote_entity_1 = require("./entities/rumor-vote.entity");
const rumor_feed_controller_1 = require("./rumor-feed.controller");
const rumor_feed_service_1 = require("./rumor-feed.service");
const classifier_service_1 = require("./classifier.service");
const market_monitor_service_1 = require("./market-monitor.service");
const moderation_service_1 = require("./moderation.service");
const ipo_module_1 = require("../ipo/ipo.module");
const users_module_1 = require("../users/users.module");
const notification_service_1 = require("../../common/services/notification.service");
const post_survival_service_1 = require("./post-survival.service");
let RumorFeedModule = class RumorFeedModule {
};
exports.RumorFeedModule = RumorFeedModule;
exports.RumorFeedModule = RumorFeedModule = __decorate([
    (0, common_1.Module)({
        imports: [
            typeorm_1.TypeOrmModule.forFeature([rumor_entity_1.RumorEntity, rumor_vote_entity_1.RumorVoteEntity]),
            ipo_module_1.IpoModule,
            users_module_1.UsersModule,
        ],
        controllers: [rumor_feed_controller_1.RumorFeedController],
        providers: [
            rumor_feed_service_1.RumorFeedService,
            classifier_service_1.ClassifierService,
            market_monitor_service_1.MarketMonitorService,
            moderation_service_1.ModerationService,
            notification_service_1.NotificationService,
            post_survival_service_1.PostSurvivalService,
        ],
        exports: [rumor_feed_service_1.RumorFeedService, classifier_service_1.ClassifierService, market_monitor_service_1.MarketMonitorService],
    })
], RumorFeedModule);
