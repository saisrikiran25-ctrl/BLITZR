import { DataSource } from 'typeorm';
import { CredibilityService } from '../users/credibility.service';
export declare class PostSurvivalService {
    private readonly dataSource;
    private readonly credibilityService;
    private readonly logger;
    constructor(dataSource: DataSource, credibilityService: CredibilityService);
    rewardSurvivedPosts(): Promise<void>;
}
