import { CreateRumorDto } from './dto/create-rumor.dto';
import { RumorFeedService } from './rumor-feed.service';
export declare class RumorFeedController {
    private readonly rumorFeedService;
    constructor(rumorFeedService: RumorFeedService);
    private mapToDto;
    createPost(req: any, body: CreateRumorDto): Promise<{
        post: any;
        visibility: "PUBLIC";
    }>;
    getFeed(req: any, page?: number, limit?: number): Promise<any[]>;
    upvote(id: string, req: any): Promise<any>;
    downvote(id: string, req: any): Promise<any>;
    dispute(id: string, req: any): Promise<{
        success: boolean;
        total_disputes: number;
    }>;
}
