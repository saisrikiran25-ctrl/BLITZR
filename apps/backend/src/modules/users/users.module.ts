import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { UserEntity } from './entities/user.entity';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { CredibilityService } from './credibility.service';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
    imports: [
        TypeOrmModule.forFeature([UserEntity]),
        NotificationsModule,
    ],
    controllers: [UsersController],
    providers: [UsersService, CredibilityService],
    exports: [UsersService, CredibilityService],
})
export class UsersModule { }
