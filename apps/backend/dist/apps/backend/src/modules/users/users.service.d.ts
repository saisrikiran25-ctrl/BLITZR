import { Repository, DataSource } from 'typeorm';
import { UserEntity } from './entities/user.entity';
export declare class UsersService {
    private readonly userRepository;
    private readonly dataSource;
    constructor(userRepository: Repository<UserEntity>, dataSource: DataSource);
    findById(userId: string): Promise<UserEntity | null>;
    findOneById(userId: string): Promise<UserEntity>;
    findByEmail(email: string): Promise<UserEntity | null>;
    findByUsername(username: string): Promise<UserEntity | null>;
    isUsernameTaken(username: string, institutionId: string): Promise<boolean>;
    create(data: Partial<UserEntity>): Promise<UserEntity>;
    update(userId: string, data: Partial<UserEntity>): Promise<UserEntity>;
    deleteUser(userId: string): Promise<void>;
}
